export type SavedDitherSettings = {
  selectedPalette: string
  selectedSize: number
  selectedStyle: string
  selectedColors: string[]
  ditherStrength: number
  erodeStrength: number
  contrastStrength: number
}

export type RecentProject = {
  original: Blob
  originalName: string
  originalType: string
  converted: Blob
  width: number
  height: number
  settings: SavedDitherSettings
  savedAt: number
}

const databaseName = 'pixelization-local-projects'
const storeName = 'recent'
const recordKey = 'last-project'

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') {
    reject(new Error('IndexedDB is unavailable'))
    return
  }

  const request = indexedDB.open(databaseName, 1)
  request.onupgradeneeded = () => {
    const database = request.result
    if (!database.objectStoreNames.contains(storeName)) {
      database.createObjectStore(storeName)
    }
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error ?? new Error('Could not open local storage'))
})

const withStore = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode)
      const request = action(transaction.objectStore(storeName))
      request.onerror = () => reject(request.error ?? new Error('Local storage request failed'))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error ?? new Error('Local storage transaction failed'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Local storage transaction failed'))
    })
  } finally {
    database.close()
  }
}

export const getRecentProject = () => withStore<RecentProject | undefined>('readonly', (store) => store.get(recordKey))
export const saveRecentProject = (project: RecentProject) => withStore<IDBValidKey>('readwrite', (store) => store.put(project, recordKey))
export const deleteRecentProject = () => withStore<undefined>('readwrite', (store) => store.delete(recordKey))

