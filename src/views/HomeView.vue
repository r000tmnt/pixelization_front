<template>
  <div>
    <main class="workspace-shell">
      <PixelizationTools
        :has-artwork="hasArtwork"
        :is-processing="isProcessing"
        @export-image="downloadArtwork"
        @settings-changed="reprocessArtwork"
        @settings-changed-debounced="scheduleReprocessArtwork"
        @show-settings="(v) => showSettings = v"
        @show-help="(v) => showHelp = v"
      />
      <ArtworkZone
        ref="artworkZone"
        :has-artwork="hasArtwork"
        :is-pad="isPad"
        :is-processing="isProcessing"
        :has-converted-artwork="hasConvertedArtwork"
        :is-comparing="isComparing"
        :comparison-split="comparisonSplit"
        :comparison-geometry="comparisonGeometry"
        :original-image-url="originalImageUrl"
        :error-message="errorMessage"
        :size-limit-m-b="settings.sizeLimitMB"
        :status="status"
        @file-selected="handleSelectedFile"
        @show-examples="showExamples = true"
        @show-settings="showSettings = $event"
        @show-help="showHelp = $event"
        @toggle-comparison="toggleComparison"
        @update:comparison-split="comparisonSplit = $event"
        @preview="openPreview"
        @download="downloadArtwork"
      />
   </main>

    <Transition name="fade">
      <SettingsDialog
        v-if="showSettings"
        @close="showSettings = false"
      />
    </Transition>
    <Transition name="fade">
      <HelpDialog v-if="showHelp" @close="showHelp = false" />
    </Transition>

    <Transition name="fade">
      <ExamplesDialog
        v-if="showExamples"
        @close="showExamples = false"
        @select-example="loadExample"
      />
    </Transition>

    <Transition name="fade">
      <ImagePreviewDialog
        v-if="showPreview && previewImage"
        :src="previewImage"
        :colors="paletteColors"
        :selected-colors="selectedColors"
        :can-undo="undoStack.length > 0 || customUndoStack.length > 0"
        :can-redo="redoStack.length > 0 || customRedoStack.length > 0"
        :is-processing="isProcessing"
        @change-color="changePaletteColor"
        @undo="undoPaletteColor"
        @redo="redoPaletteColor"
        @apply-custom="applyCustomPalette"
        @save-artwork="saveEditedArtwork"
        @close="closePreview"
      />
    </Transition>

    <FooterSection v-if="isPad" />
  </div>

</template>

<script setup lang="ts">
import { computed, nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
import PixelizationTools from '../components/PixelizationTools.vue'
import FooterSection from '@/components/footerSection.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import ArtworkZone from '@/components/ArtworkZone.vue'
import ImagePreviewDialog from '@/components/ImagePreviewDialog.vue'
import HelpDialog from '@/components/HelpDialog.vue'
import ExamplesDialog from '@/components/ExamplesDialog.vue'

import pixelApi from '../api/pixel'
import { storeToRefs } from 'pinia'
import { usePixelizationStore } from '../stores/pixelization'
import { useDefaultStore } from '@/stores/default.ts'
import { useI18n } from 'vue-i18n'
import { getRecentProject, saveRecentProject } from '@/storage/recentProject'

const settings = usePixelizationStore()
const defaultStore = useDefaultStore()

const { isPad, } = storeToRefs(defaultStore)
const { setIsPad, setIsMobile, setLocale } = defaultStore

const { t } = useI18n()

const showHelp = ref(false)
const showSettings = ref(false)
const showPreview = ref(false)
const previewImage = ref('')
const paletteIndexMap = ref<Uint8Array | null>(null)
const paletteBaseColors = ref<string[]>([])
const paletteColors = ref<string[]>([])
const paletteEdits = ref<Record<string, string>>({})
const editPaletteId = ref<string | null>(null)
const undoStack = ref<string[][]>([])
const redoStack = ref<string[][]>([])
type EditorSnapshot = {
  image: string
  settings: ReturnType<typeof savedSettings>
  paletteEdits: Record<string, string>
  paletteIndexMap: Uint8Array | null
  paletteBaseColors: string[]
  paletteColors: string[]
  editPaletteId: string | null
}
const customUndoStack = ref<EditorSnapshot[]>([])
const customRedoStack = ref<EditorSnapshot[]>([])
const maxPaletteHistory = 50

const artworkZone = ref<InstanceType<typeof ArtworkZone> | null>(null)
const canvas = computed<HTMLCanvasElement | null>(() => artworkZone.value?.canvas ?? null)
const previewButton = computed<HTMLButtonElement | null>(() => artworkZone.value?.previewButton ?? null)
const showExamples = ref(false)
const sourceFile = ref<File | null>(null)
const originalImageUrl = ref('')
const isComparing = ref(false)
const comparisonSplit = ref(50)
const comparisonGeometry = ref({ left: 0, top: 0, width: 0, height: 0 })
const isProcessing = ref(false)
const errorMessage = ref('')
const hasConvertedArtwork = ref(false)
// const imageDetails = ref('')
const reprocessDebounceMs = 250
const conversionRetryDelayMs = 750
let reprocessTimer: ReturnType<typeof setTimeout> | undefined
let latestRequestId = 0
const hasArtwork = computed(() => sourceFile.value !== null)
const status = computed(() =>
  isProcessing.value
    ? { type: 'processing', label: 'status-process' }
    : errorMessage.value
      ? { type: 'error', label: 'status-error' }
      : hasArtwork.value
        ? { type: 'ready', label: 'status-ready' }
        : { type: 'idle', label: 'status-wait' },
)

watch(sourceFile, (file) => {
  if (originalImageUrl.value) URL.revokeObjectURL(originalImageUrl.value)
  originalImageUrl.value = file ? URL.createObjectURL(file) : ''
  isComparing.value = false
  comparisonSplit.value = 50
})

const updateComparisonGeometry = () => {
  const target = canvas.value
  const container = target?.parentElement
  if (!target || !container) return
  const imageRect = target.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  comparisonGeometry.value = {
    left: imageRect.left - containerRect.left,
    top: imageRect.top - containerRect.top,
    width: imageRect.width,
    height: imageRect.height,
  }
}

const toggleComparison = async () => {
  isComparing.value = !isComparing.value
  if (isComparing.value) {
    await nextTick()
    updateComparisonGeometry()
  }
}

const {
  selectedPalette,
  selectedSize,
  selectedStyle,
  selectedColors,
  ditherStrength,
  erodeStrength,
  contrastStrength,
  rememberLastProject
} = storeToRefs(settings)

const savedSettings = () => ({
  selectedPalette: selectedPalette.value,
  selectedSize: selectedSize.value,
  selectedStyle: selectedStyle.value,
  selectedColors: [...selectedColors.value],
  ditherStrength: ditherStrength.value,
  erodeStrength: erodeStrength.value,
  contrastStrength: contrastStrength.value,
})

const persistProject = async (original: File, convertedDataUrl: string, width: number, height: number) => {
  if (!rememberLastProject.value) return
  try {
    const converted = await fetch(convertedDataUrl).then((response) => response.blob())
    await saveRecentProject({
      original,
      originalName: original.name,
      originalType: original.type,
      converted,
      width,
      height,
      settings: savedSettings(),
      paletteEdits: { ...paletteEdits.value },
      savedAt: Date.now(),
    })
  } catch (error) {
    // Storage is optional; a quota or browser policy failure must not fail conversion.
    console.warn('Could not save the recent project locally:', error)
  }
}

const handleSelectedFile = (file: File) => {
  if (checkFileType(file) && checkFileSize(file)) processFile(file)
}

const loadExample = async (example: { src: string; nameKey: string; palette: string }) => {
  showExamples.value = false
  settings.setPalette(example.palette)
  try {
    const response = await fetch(example.src)
    if (!response.ok) throw new Error('Could not load example image')
    const blob = await response.blob()
    const filename = example.src.split('/').pop() ?? 'pixelization-example.jpg'
    processFile(new File([blob], filename, { type: blob.type || 'image/jpeg' }))
  } catch (error) {
    console.warn('Could not load example image:', error)
    errorMessage.value = t('error-failed')
  }
}

const openPreview = () => {
  const target = canvas.value
  if (!target || isProcessing.value) return
  previewImage.value = target.toDataURL('image/png')
  showPreview.value = true
}

const rgbToHex = (rgb: number[]) => `#${rgb.slice(0, 3).map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')).join('')}`

const paletteEditKey = (baseColor: string) => `${editPaletteId.value ?? selectedPalette.value}:${baseColor.toLowerCase()}`

const syncPaletteEdits = (colors: string[]) => {
  for (let index = 0; index < paletteBaseColors.value.length; index++) {
    const baseColor = paletteBaseColors.value[index]
    const color = colors[index]
    if (!baseColor || !color) continue
    const key = paletteEditKey(baseColor)
    if (color.toLowerCase() === baseColor.toLowerCase()) delete paletteEdits.value[key]
    else paletteEdits.value[key] = color
  }
}

const applyPaletteColors = () => {
  const target = canvas.value
  const indices = paletteIndexMap.value
  if (!target || !indices || indices.length !== target.width * target.height) return
  const context = target.getContext('2d')
  if (!context) return
  const image = context.getImageData(0, 0, target.width, target.height)
  for (let pixel = 0; pixel < indices.length; pixel++) {
    const paletteIndex = indices[pixel]!
    const color = paletteColors.value[paletteIndex]
    if (paletteIndex === 255 || !color) continue
    const offset = pixel * 4
    image.data[offset] = Number.parseInt(color.slice(1, 3), 16)
    image.data[offset + 1] = Number.parseInt(color.slice(3, 5), 16)
    image.data[offset + 2] = Number.parseInt(color.slice(5, 7), 16)
  }
  context.putImageData(image, 0, 0)
  if (showPreview.value) previewImage.value = target.toDataURL('image/png')
}

const persistEditedArtwork = () => {
  const target = canvas.value
  const original = sourceFile.value
  if (!target || !original || !rememberLastProject.value) return
  void persistProject(original, target.toDataURL('image/png'), target.width, target.height)
}

const changePaletteColor = (index: number, color: string) => {
  if (!paletteColors.value[index] || paletteColors.value[index] === color) return
  undoStack.value.push([...paletteColors.value])
  if (undoStack.value.length > maxPaletteHistory) undoStack.value.shift()
  redoStack.value = []
  const nextColors = [...paletteColors.value]
  nextColors[index] = color
  paletteColors.value = nextColors
  const baseColor = paletteBaseColors.value[index]
  if (baseColor) {
    const key = paletteEditKey(baseColor)
    if (color.toLowerCase() === baseColor.toLowerCase()) delete paletteEdits.value[key]
    else paletteEdits.value[key] = color
  }
  applyPaletteColors()
  persistEditedArtwork()
}

const undoPaletteColor = () => {
  const previous = undoStack.value.pop()
  if (!previous) {
    const snapshot = customUndoStack.value.pop()
    if (!snapshot || !sourceFile.value) return
    customRedoStack.value.push(captureEditorSnapshot())
    void restoreEditorSnapshot(snapshot)
    return
  }
  redoStack.value.push([...paletteColors.value])
  paletteColors.value = previous
  syncPaletteEdits(previous)
  applyPaletteColors()
  persistEditedArtwork()
}

const redoPaletteColor = () => {
  const next = redoStack.value.pop()
  if (!next) {
    const snapshot = customRedoStack.value.pop()
    if (!snapshot || !sourceFile.value) return
    customUndoStack.value.push(captureEditorSnapshot())
    void restoreEditorSnapshot(snapshot)
    return
  }
  undoStack.value.push([...paletteColors.value])
  paletteColors.value = next
  syncPaletteEdits(next)
  applyPaletteColors()
  persistEditedArtwork()
}

const applyCustomPalette = (colors: string[]) => {
  if (canvas.value) {
    customUndoStack.value.push(captureEditorSnapshot())
    if (customUndoStack.value.length > maxPaletteHistory) customUndoStack.value.shift()
    customRedoStack.value = []
  }
  settings.setCustomColors(colors)
  settings.setPalette('custom')
  reprocessArtwork()
}

const captureEditorSnapshot = (): EditorSnapshot => ({
  image: canvas.value?.toDataURL('image/png') ?? '',
  settings: savedSettings(),
  paletteEdits: { ...paletteEdits.value },
  paletteIndexMap: paletteIndexMap.value ? new Uint8Array(paletteIndexMap.value) : null,
  paletteBaseColors: [...paletteBaseColors.value],
  paletteColors: [...paletteColors.value],
  editPaletteId: editPaletteId.value,
})

const restoreEditorSnapshot = async (snapshot: EditorSnapshot) => {
  if (!snapshot.image || !sourceFile.value) return
  selectedPalette.value = snapshot.settings.selectedPalette
  selectedSize.value = snapshot.settings.selectedSize
  selectedStyle.value = snapshot.settings.selectedStyle
  settings.setCustomColors(snapshot.settings.selectedColors)
  ditherStrength.value = snapshot.settings.ditherStrength
  erodeStrength.value = snapshot.settings.erodeStrength
  contrastStrength.value = snapshot.settings.contrastStrength
  paletteEdits.value = { ...snapshot.paletteEdits }
  paletteIndexMap.value = snapshot.paletteIndexMap ? new Uint8Array(snapshot.paletteIndexMap) : null
  paletteBaseColors.value = [...snapshot.paletteBaseColors]
  paletteColors.value = [...snapshot.paletteColors]
  editPaletteId.value = snapshot.editPaletteId
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Saved editor state failed to load'))
    image.src = snapshot.image
  })
  const target = canvas.value
  const context = target?.getContext('2d')
  if (!target || !context) return
  target.width = image.naturalWidth
  target.height = image.naturalHeight
  context.imageSmoothingEnabled = false
  context.drawImage(image, 0, 0)
  if (showPreview.value) previewImage.value = snapshot.image
  persistEditedArtwork()
}

const saveEditedArtwork = async (dataUrl: string) => {
  const target = canvas.value
  const original = sourceFile.value
  if (!target || !original) return
  await drawArtwork(dataUrl, target.width, target.height)
  persistEditedArtwork()
}

const closePreview = () => {
  showPreview.value = false
}

watch(showPreview, async (isOpen) => {
  if (isOpen) return
  await nextTick()
  previewButton.value?.focus()
})

const checkFileType = (file: File | undefined) => {
  const type = file?.type
  if (!file || !type){
    errorMessage.value = t('error-file')
    return false
  }

  // Check file type
  if(settings.acceptFileTypes.includes(type)) {
    return true
  }else{
    errorMessage.value = t('error-type')
    return false
  }
}

const checkFileSize = (file: File | undefined) => {
    const size = file?.size
  if (!file || !size){
    errorMessage.value = t('error-file')
    return false
  }

  // Check file size
  //  bytes/(1024*1024)
  const mb = size/(1024*1024)
  if(mb <= settings.sizeLimitMB) {
    return true
  }else{
    errorMessage.value = t('error-size')
    return false
  }
}

const reprocessArtwork = () => {
  clearTimeout(reprocessTimer)
  if (sourceFile.value) {

    processFile(sourceFile.value)
  }
}

const scheduleReprocessArtwork = () => {
  clearTimeout(reprocessTimer)
  if (!sourceFile.value) return
  // Invalidate any conversion already running with the previous slider value.
  latestRequestId++
  reprocessTimer = setTimeout(() => {
    reprocessTimer = undefined
    reprocessArtwork()
  }, reprocessDebounceMs)
}

const isRetryableConversionError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false

  const requestError = error as {
    code?: string
    response?: { status?: number }
  }

  return [502, 503, 504].includes(requestError.response?.status ?? 0)
    || ['ERR_NETWORK', 'ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED'].includes(requestError.code ?? '')
}

const processFile = async(file: File, preserveOnError = false) => {
  // if (!file.type.startsWith('image/')) {
  //   errorMessage.value = 'Choose an image file to begin.'
  //   return
  // }
  clearTimeout(reprocessTimer)
  sourceFile.value = file
  isComparing.value = false
  hasConvertedArtwork.value = false
  const requestId = ++latestRequestId
  errorMessage.value = ''
  isProcessing.value = true
  const form = new FormData()
  form.append('pixelSize', String(selectedSize.value))
  form.append('palette', selectedPalette.value)
  form.append('ditherStrength', String(ditherStrength.value))
  form.append('erodeStrength', String(erodeStrength.value))
  form.append('contrastStrength', String(contrastStrength.value))
  form.append('ditherStyle', String(selectedStyle.value))
  form.append('file', file)

  if (selectedPalette.value === 'custom' && selectedColors.value.length > 0) {
    const customColors = selectedColors.value.join(';')
    form.append('customColors', customColors)
  }

  try {
    let result: Awaited<ReturnType<typeof pixelApi.convert>> | undefined
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        result = await pixelApi.convert(form)
        break
      } catch (error) {
        if (attempt === 1 || !isRetryableConversionError(error)) throw error
        await new Promise((resolve) => setTimeout(resolve, conversionRetryDelayMs))
        if (requestId !== latestRequestId) return
      }
    }

    if (!result) throw new Error('Conversion failed after retry')
    if (!result?.data?.data || !result.data.width || !result.data.height)
      throw new Error('Invalid conversion response')

    const { width, height } = result.data
    const isLandscape = width >= height;

    const canvasElement = canvas.value
    if (!canvasElement) throw new Error('Canvas unavailable')

    if((width / 2) < height) {
      canvasElement.style.width = 'auto'
      canvasElement.style.height = '100%'
    }else{
      canvasElement.style.width = isLandscape ?'100%' : 'auto'
      canvasElement.style.height = isLandscape ?'auto' : '100%'
    }

    if (requestId !== latestRequestId) return
    await drawArtwork(result.data.data, result.data.width, result.data.height, requestId)
    if (requestId === latestRequestId) hasConvertedArtwork.value = true
    await persistProject(file, result.data.data, width, height)

    processImagePalette(result.data)

    // console.log(`width: ${width}, height: ${height}`)
    // imageDetails.value = `${result.data.width} × ${result.data.height} px · ${settings.selectedSize}× blocks`
  } catch (error) {
    if (requestId !== latestRequestId) return
    console.log(error)
    hasConvertedArtwork.value = false
    if (!preserveOnError) sourceFile.value = null
    paletteIndexMap.value = null
    paletteBaseColors.value = []
    paletteColors.value = []
    editPaletteId.value = null
    undoStack.value = []
    redoStack.value = []
    errorMessage.value = t('error-failed')
    // console.error('Pixelization failed:', error)
  } finally {
    if (requestId === latestRequestId) isProcessing.value = false
  }
}

const processImagePalette = (data: { palette: number[][]; paletteIndexMap: string, width: number, height: number }) => {
    const responsePalette = Array.isArray(data.palette)
      ? data.palette as number[][]
      : []
    const encodedIndexMap = data.paletteIndexMap
    let nextPaletteIndexMap: Uint8Array | null = null
    if (typeof encodedIndexMap === 'string' && responsePalette.length > 0) {
      const decoded = Uint8Array.from(atob(encodedIndexMap), (character) => character.charCodeAt(0))
      if (decoded.length === data.width * data.height) nextPaletteIndexMap = decoded
    }

    paletteIndexMap.value = nextPaletteIndexMap
    const nextPalette = responsePalette.map(rgbToHex)
    const nextEditPaletteId = nextPaletteIndexMap ? selectedPalette.value : null
    editPaletteId.value = nextEditPaletteId
    paletteBaseColors.value = nextPalette
    const nextPaletteColors = nextPalette.map((baseColor) =>
      nextEditPaletteId
        ? paletteEdits.value[`${nextEditPaletteId}:${baseColor.toLowerCase()}`] ?? baseColor
        : baseColor,
    )
    paletteColors.value = nextPaletteColors

    const hasPaletteEdits = nextPalette.some((baseColor, index) => nextPaletteColors[index] !== baseColor)
    if (nextPaletteIndexMap && hasPaletteEdits) applyPaletteColors()
    if (showPreview.value && canvas.value) previewImage.value = canvas.value.toDataURL('image/png')
}

const drawArtwork = async(dataUrl: string, width: number, height: number, requestId?: number) => {
  await nextTick()
  const target = canvas.value
  if (!target) throw new Error('Canvas unavailable')
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image failed to load'))
    image.src = dataUrl
  })
  if (requestId !== undefined && requestId !== latestRequestId) return
  target.width = width
  target.height = height
  const context = target.getContext('2d')
  if (!context) throw new Error('Canvas context unavailable')
  context.imageSmoothingEnabled = false
  context.drawImage(image, 0, 0, width, height)
}

const downloadArtwork = async() => {
  const target = canvas.value
  if (!target) return

  console.log(navigator.platform);

  const isApple = /iPad|iPhone/.test(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)

  if(isApple){
    const blob = await new Promise<Blob>((resolve, reject) => {
      target.toBlob((result) => result ? resolve(result) : reject(new Error('Failed to create image blob')), 'image/png')
    })
    const file = new File([blob], 'pixelization-artwork.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
          await navigator.share({ files: [file], title: 'Canvas Screenshot' });
      }
      catch (e) {
        console.log(e)
          /* 使用者取消 */
      }
    }
  }else{
    const link = document.createElement('a')
    link.download = 'pixelization-artwork.png'
    link.href = target.toDataURL('image/png')
    link.click()
  }
}

const onResize = () => {
  setIsPad(window.innerWidth <= 899)
  setIsMobile(window.innerWidth <= 620)
  if (isComparing.value) void nextTick().then(updateComparisonGeometry)
}

watch(rememberLastProject, (enabled) => {
  if (enabled && sourceFile.value && !isProcessing.value) reprocessArtwork()
})

onMounted(async () => {
  onResize()
  addEventListener('resize', onResize)

  const locale = localStorage.getItem('locale')

  if(locale){
    setLocale(locale)
  }

  if (rememberLastProject.value) {
    try {
      const project = await getRecentProject()
      if (!rememberLastProject.value || sourceFile.value || latestRequestId !== 0) return

      if(project){
        settings.setPalette(project.settings.selectedPalette)
        settings.setPixelSize(project.settings.selectedSize)
        settings.setDitherStyle(project.settings.selectedStyle)
        settings.setCustomColors(project.settings.selectedColors)
        settings.setDitherStrength(project.settings.ditherStrength)
        settings.setErodeStrength(project.settings.erodeStrength)
        settings.setContrastStrength(project.settings.contrastStrength)
        paletteEdits.value = project.paletteEdits ?? {}
      }

      if (project&& project.converted instanceof Blob) {
        const restoredFile = new File([project.original], project.originalName, {
          type: project.originalType || project.original.type || 'image/png',
        })
        const convertedUrl = URL.createObjectURL(project.converted)
        sourceFile.value = restoredFile
        try {
          await drawArtwork(convertedUrl, project.width, project.height)
          hasConvertedArtwork.value = true
        } finally {
          URL.revokeObjectURL(convertedUrl)
        }
      }
      else if(project && project.original instanceof Blob){
        const restoredFile = new File([project.original], project.originalName, {
          type: project.originalType || project.original.type || 'image/png',
        })
        sourceFile.value = restoredFile
        void processFile(restoredFile, true)
      }
    } catch (error) {
      console.warn('Could not restore the recent project from local storage:', error)
    }
  }
})

onUnmounted(() => {
  clearTimeout(reprocessTimer)
  latestRequestId++
  if (originalImageUrl.value) URL.revokeObjectURL(originalImageUrl.value)
  removeEventListener('resize', onResize)
})
</script>

<style scoped>
.workspace-shell {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  min-height: 100vh;
}
@media (max-width: 899px) {
  .workspace-shell { grid-template-columns: 1fr; }
}
:deep(.fade-enter-active),
:deep(.fade-leave-active) { transition: opacity 0.3s ease; }
:deep(.fade-enter-from),
:deep(.fade-leave-to) { opacity: 0; }
</style>
