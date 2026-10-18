<template>
  <main class="workspace-shell">
    <PixelizationTools
      :has-artwork="hasArtwork"
      :is-processing="isProcessing"
      @choose-image="openFilePicker"
      @export-image="downloadArtwork"
      @settings-changed="reprocessArtwork"
      @settings-changed-debounced="scheduleReprocessArtwork"
      @show-settings="(v) => showSettings = v"
    />
    <section class="artwork-zone" aria-labelledby="stage-title">
      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        accept="image/*"
        aria-label="Choose an image to pixelize"
        @change="handleFileInput"
      />
      <div class="stage-meta">
        <div class="stage-status">
          <div class="status-row" aria-live="polite">
            <span :class="['status-dot', status.type]" aria-hidden="true"></span
            ><span>{{ $t(status.label) }}</span>
          </div>
        </div>

        <SettingToggle v-if="!isPad" @settings-changed="(v) => showSettings = v" />
      </div>
      <div
        :class="['canvas-stage', { 'is-dragging': isDragging, 'has-artwork': hasArtwork }]"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <button v-if="!hasArtwork" class="upload-zone" type="button" @click="openFilePicker">
          <span class="upload-icon" aria-hidden="true">+</span
          ><strong>{{ $t("upload-hint") }}</strong
          ><small>{{ $t("upload-type") }}</small>
          <small>{{ $t("upload-limit", {limit: settings.sizeLimitMB}) }}</small>
        </button>
        <div v-else class="canvas-wrap">
          <canvas ref="canvas" aria-label="Pixelized artwork" @click="openFilePicker"></canvas
          ><button class="replace-overlay" type="button" @click="openFilePicker">
            {{ $t("upload-change") }}
          </button>
        </div>
        <div v-if="isProcessing" class="processing-overlay" role="status">
          <span class="scan-line" aria-hidden="true"></span><span>{{ $t("status-process") }}</span>
        </div>
        <div v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</div>
      </div>
      <div class="actions output" aria-label="Image actions" :style="{opacity: hasArtwork? 1 : 0, transition: 'all 0.3 ease'}">
        <button
          ref="previewButton"
          class="button secondary"
          type="button"
          :disabled="!hasArtwork || isProcessing"
          @click="openPreview"
        >
          {{ $t("preview-edit") }}
        </button>
        <button
          class="button secondary"
          type="button"
          :disabled="!hasArtwork || isProcessing"
          @click="downloadArtwork"
        >
          {{ $t("download") }}
        </button>
      </div>
    </section>

    <Transition name="fade">
      <SettingsDialog
        v-if="showSettings"
        @close="showSettings = false"
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

    <footerSection v-if="isPad" />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, onMounted, onUnmounted, watch } from 'vue'
import PixelizationTools from '../components/PixelizationTools.vue'
import footerSection from '@/components/footerSection.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import SettingToggle from '@/components/SettingToggle.vue'
import ImagePreviewDialog from '@/components/ImagePreviewDialog.vue'

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

const showSettings = ref(false)
const showPreview = ref(false)
const previewImage = ref('')
const previewButton = ref<HTMLButtonElement | null>(null)
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

const fileInput = ref<HTMLInputElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const sourceFile = ref<File | null>(null)
const isProcessing = ref(false)
const isDragging = ref(false)
const errorMessage = ref('')
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

const openFilePicker = () => {
  fileInput.value?.click()
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

const onPaletteHistoryKeydown = (event: KeyboardEvent) => {
  if (!showPreview.value || !(event.ctrlKey || event.metaKey)) return
  const target = event.target
  if (target instanceof HTMLElement && (target.isContentEditable || target.closest('textarea, select, input:not([type="color"])'))) return
  const key = event.key.toLowerCase()
  if (key === 'z' && event.shiftKey) {
    event.preventDefault()
    redoPaletteColor()
  } else if (key === 'z') {
    event.preventDefault()
    undoPaletteColor()
  } else if (key === 'y') {
    event.preventDefault()
    redoPaletteColor()
  }
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

const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const validType = checkFileType(input.files?.[0])
  const validSize = checkFileSize(input.files?.[0])
  if(validType && validSize){
    processFile(input.files?.[0] as File)
    input.value = ''
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const validType = checkFileType(event.dataTransfer?.files[0])
  const validSize = checkFileSize(event.dataTransfer?.files[0])
  if(validType && validSize) processFile(event.dataTransfer?.files[0] as File)
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

    const responsePalette = Array.isArray(result.data.palette)
      ? result.data.palette as number[][]
      : []
    const encodedIndexMap = result.data.paletteIndexMap
    let nextPaletteIndexMap: Uint8Array | null = null
    if (typeof encodedIndexMap === 'string' && responsePalette.length > 0) {
      const decoded = Uint8Array.from(atob(encodedIndexMap), (character) => character.charCodeAt(0))
      if (decoded.length === result.data.width * result.data.height) nextPaletteIndexMap = decoded
    }

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
    await persistProject(file, result.data.data, width, height)

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
    undoStack.value = []
    redoStack.value = []
    const hasPaletteEdits = nextPalette.some((baseColor, index) => nextPaletteColors[index] !== baseColor)
    if (nextPaletteIndexMap && hasPaletteEdits) applyPaletteColors()
    if (showPreview.value && canvas.value) previewImage.value = canvas.value.toDataURL('image/png')

    // console.log(`width: ${width}, height: ${height}`)
    // imageDetails.value = `${result.data.width} × ${result.data.height} px · ${settings.selectedSize}× blocks`
  } catch (error) {
    if (requestId !== latestRequestId) return
    console.log(error)
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
}

watch(rememberLastProject, (enabled) => {
  if (enabled && sourceFile.value && !isProcessing.value) reprocessArtwork()
})

onMounted(async () => {
  onResize()
  addEventListener('resize', onResize)
  addEventListener('keydown', onPaletteHistoryKeydown)

  const locale = localStorage.getItem('locale')

  if(locale){
    setLocale(locale)
  }

  if (rememberLastProject.value) {
    try {
      const project = await getRecentProject()
      if (!rememberLastProject.value || sourceFile.value || latestRequestId !== 0) return
      if (project && project.original instanceof Blob && project.converted instanceof Blob) {
        const restoredFile = new File([project.original], project.originalName, {
          type: project.originalType || project.original.type || 'image/png',
        })
        selectedPalette.value = project.settings.selectedPalette
        selectedSize.value = project.settings.selectedSize
        selectedStyle.value = project.settings.selectedStyle
        settings.setCustomColors(project.settings.selectedColors)
        ditherStrength.value = project.settings.ditherStrength
        erodeStrength.value = project.settings.erodeStrength
        contrastStrength.value = project.settings.contrastStrength
        paletteEdits.value = project.paletteEdits ?? {}
        sourceFile.value = restoredFile
        const convertedUrl = URL.createObjectURL(project.converted)
        try {
          await drawArtwork(convertedUrl, project.width, project.height)
        } finally {
          URL.revokeObjectURL(convertedUrl)
        }
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
  removeEventListener('resize', onResize)
  removeEventListener('keydown', onPaletteHistoryKeydown)
})
</script>

<style scoped>
.workspace-shell {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  min-height: 100vh;
}
.artwork-zone {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  padding: 32px;
  background: var(--px-ink);
}
.stage-meta {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}
.eyebrow {
  margin: 0;
  color: var(--px-azure);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.stage-meta h2 {
  margin: 7px 0 0;
  font-size: clamp(1.45rem, 2.5vw, 2rem);
  line-height: 1.15;
}
.image-details {
  margin: 0;
  color: var(--px-text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  white-space: nowrap;
}
.canvas-stage {
  position: relative;
  display: grid;
  /* min-height: min(75vh, 720px); */
  overflow: hidden;
  place-items: center;
  border: 1px solid var(--px-grid);
  background-color: #0e0d18;
  background-image:
    linear-gradient(var(--px-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--px-grid) 1px, transparent 1px);
  background-size: 8px 8px;
  margin-bottom: 22px;
}
.canvas-stage.has-artwork {
  background-image: none;
}
.canvas-stage.is-dragging {
  border-color: var(--px-violet-bright);
  box-shadow:
    inset 0 0 0 1px var(--px-violet-bright),
    var(--shadow-glow);
}
.upload-zone {
  display: grid;
  gap: 13px;
  width: 100%;
  min-height: inherit;
  place-content: center;
  border: 0;
  background: rgb(11 10 19 / 70%);
  color: var(--px-text);
  cursor: pointer;
}
.upload-zone strong {
  /* font-family: var(--font-display); */
  font-size: clamp(1rem, 2vw, 1.25rem);
}
.upload-zone small {
  color: var(--px-text-muted);
}
.upload-icon {
  display: grid;
  width: 40px;
  height: 40px;
  margin: auto;
  place-items: center;
  border: 1px solid var(--px-violet);
  color: var(--px-violet-bright);
  font-family: var(--font-mono);
  font-size: 1.6rem;
}
.canvas-wrap {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  place-items: center;
}
.canvas-wrap canvas {
  width: auto;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  cursor: pointer;
}
.replace-overlay {
  position: absolute;
  bottom: 18px;
  left: 50%;
  padding: 9px 12px;
  transform: translateX(-50%);
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: rgb(11 10 19 / 85%);
  color: var(--px-text-muted);
  font-size: 0.78rem;
  opacity: 0;
  transition: opacity 0.15s ease;
  cursor: pointer;
}
.canvas-wrap:hover .replace-overlay,
.replace-overlay:focus-visible {
  opacity: 1;
}
.error-message {
  position: absolute;
  right: 16px;
  bottom: 16px;
  max-width: min(90%, 420px);
  padding: 12px 14px;
  border: 1px solid var(--px-danger);
  border-radius: var(--radius-sm);
  background: var(--px-surface);
  color: var(--px-text);
  font-size: 0.9rem;
}
button:focus-visible {
  outline: 2px solid var(--px-azure);
  outline-offset: 2px;
}
.actions{
  display: flex;
  justify-content: center;
  gap: 12px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  /* margin-top: 42px; */
  color: var(--px-text-muted);
}
.stage-status {
  display: flex;
  align-items: center;
  gap: 16px;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--px-text-muted);
}
.status-dot.ready {
  background: var(--px-success);
}
.status-dot.processing {
  background: var(--px-azure);
  animation: pulse 1s steps(2, end) infinite;
}
.status-dot.error {
  background: var(--px-danger);
}

@media (prefers-reduced-motion: reduce) {
  .replace-overlay {
    animation: none;
    transition: none;
  }
}

@media (max-width: 899px) {
  .workspace-shell {
    grid-template-columns: 1fr;
  }
  .artwork-zone {
    padding: 24px;
  }
  .canvas-stage {
    min-height: 55vh;
  }
}
@media (max-width: 620px) {
  .artwork-zone {
    padding: 24px 16px;
  }
  .stage-meta {
    align-items: center;
    gap: 12px;
  }
  .image-details {
    white-space: normal;
  }
  .canvas-stage {
    min-height: 46vh;
  }
  .replace-overlay {
    opacity: 1;
  }
}

:deep(.fade-enter-active),
:deep(.fade-leave-active) {
  transition: opacity 0.3s ease;
}

:deep(.fade-enter-from),
:deep(.fade-leave-to) {
  opacity: 0;
}
</style>
