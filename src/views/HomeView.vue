<template>
  <main class="workspace-shell">
    <PixelizationTools
      :has-artwork="hasArtwork"
      :is-processing="isProcessing"
      :status-type="status.type"
      :status-label="status.label"
      @choose-image="openFilePicker"
      @export-image="downloadArtwork"
      @settings-changed="reprocessArtwork"
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
        <div>
          <p class="eyebrow">Artwork stage</p>
          <h2 id="stage-title">
            {{ hasArtwork ? 'Your pixel art is ready.' : 'Make pixels from a photo.' }}
          </h2>
        </div>
        <p v-if="imageDetails" class="image-details">{{ imageDetails }}</p>
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
          ><strong>Drop an image here or choose a file.</strong
          ><small>PNG, JPG, WEBP, or GIF</small>
          <small>{{ settings.sizeLimitMB }} MB MAX</small>
        </button>
        <div v-else class="canvas-wrap">
          <canvas ref="canvas" aria-label="Pixelized artwork" @click="openFilePicker"></canvas
          ><button class="replace-overlay" type="button" @click="openFilePicker">
            Click the artwork to replace it
          </button>
        </div>
        <div v-if="isProcessing" class="processing-overlay" role="status">
          <span class="scan-line" aria-hidden="true"></span><span>Processing image</span>
        </div>
        <div v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import PixelizationTools from '../components/PixelizationTools.vue'
import pixelApi from '../api/pixel'
import { usePixelizationStore } from '../stores/pixelization'

const settings = usePixelizationStore()
const fileInput = ref<HTMLInputElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const sourceFile = ref<File | null>(null)
const isProcessing = ref(false)
const isDragging = ref(false)
const errorMessage = ref('')
const imageDetails = ref('')
const hasArtwork = computed(() => sourceFile.value !== null)
const status = computed(() =>
  isProcessing.value
    ? { type: 'processing', label: 'PROCESSING' }
    : errorMessage.value
      ? { type: 'error', label: 'ERROR' }
      : hasArtwork.value
        ? { type: 'ready', label: 'READY' }
        : { type: 'idle', label: 'AWAITING IMAGE' },
)

const openFilePicker = () => {
  fileInput.value?.click()
}

const checkFileType = (file: File | undefined) => {
  const type = file?.type
  if (!file || !type){
    errorMessage.value = 'File not found.'
    return false
  }

  // Check file type
  if(settings.acceptFileTypes.includes(type)) {
    return true
  }else{
    errorMessage.value = 'Invalid file type. Please choose a PNG, JPG, WEBP, or GIF image.'
    return false
  }
}

const checkFileSize = (file: File | undefined) => {
    const size = file?.size
  if (!file || !size){
    errorMessage.value = 'File not found.'
    return false
  }

  // Check file size
  //  bytes/(1024*1024)
  const mb = size/(1024*1024)
  if(mb <= settings.sizeLimitMB) {
    return true
  }else{
    errorMessage.value = 'File size limit exceeded.'
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
  if (sourceFile.value) void processFile(sourceFile.value)
}

const processFile = async(file: File) => {
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Choose an image file to begin.'
    return
  }
  sourceFile.value = file
  errorMessage.value = ''
  isProcessing.value = true
  const form = new FormData()
  form.append('pixelSize', String(settings.selectedSize))
  form.append('palette', settings.selectedPalette)
  form.append('ditherStrength', String(settings.ditherStrength))
  form.append('ditherStyle', String(settings.selectedStyle))
  form.append('file', file)
  try {
    const result = await pixelApi.convert(form)
    if (!result?.data?.data || !result.data.width || !result.data.height)
      throw new Error('Invalid conversion response')
    await drawArtwork(result.data.data, result.data.width, result.data.height)
    imageDetails.value = `${result.data.width} × ${result.data.height} px · ${settings.selectedSize}× blocks`
  } catch (error) {
    sourceFile.value = null
    errorMessage.value = 'We could not pixelize that image. Please try another file.'
    console.error('Pixelization failed:', error)
  } finally {
    isProcessing.value = false
  }
}

const drawArtwork = async(dataUrl: string, width: number, height: number) => {
  await nextTick()
  const target = canvas.value
  if (!target) throw new Error('Canvas unavailable')
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image failed to load'))
    image.src = dataUrl
  })
  target.width = width
  target.height = height
  const context = target.getContext('2d')
  if (!context) throw new Error('Canvas context unavailable')
  context.imageSmoothingEnabled = false
  context.drawImage(image, 0, 0, width, height)
}

const downloadArtwork = () => {
  const target = canvas.value
  if (!target) return
  const link = document.createElement('a')
  link.download = 'pixelization-artwork.png'
  link.href = target.toDataURL('image/png')
  link.click()
}
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
  min-height: min(72vh, 720px);
  overflow: hidden;
  place-items: center;
  border: 1px solid var(--px-grid);
  background-color: #0e0d18;
  background-image:
    linear-gradient(var(--px-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--px-grid) 1px, transparent 1px);
  background-size: 8px 8px;
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
  font-family: var(--font-display);
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
.processing-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  overflow: hidden;
  place-items: center;
  background: rgb(11 10 19 / 72%);
  color: var(--px-text);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.scan-line {
  position: absolute;
  width: 100%;
  height: 3px;
  background: var(--px-azure);
  box-shadow: 0 0 18px var(--px-azure);
  animation: scan 0.75s linear infinite;
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
@keyframes scan {
  from {
    transform: translateY(-360px);
  }
  to {
    transform: translateY(720px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .scan-line,
  .replace-overlay {
    animation: none;
    transition: none;
  }
}
@media (min-width: 900px) {
  .canvas-stage {
    height: min(72vh, 720px);
    min-height: 0;
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
    align-items: start;
    flex-direction: column;
    gap: 8px;
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
</style>
