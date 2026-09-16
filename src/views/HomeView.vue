<template>
  <main class="workspace-shell">
    <PixelizationTools
      :has-artwork="hasArtwork"
      :is-processing="isProcessing"
      :show-locale="showLocale"
      @choose-image="openFilePicker"
      @export-image="downloadArtwork"
      @settings-changed="reprocessArtwork"
      @open-custom-palette="toggleCustomPalette"
      @show-locale="(v) => showLocale = v"
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
          <!-- <p class="eyebrow">{{ $t('label-status') }}</p> -->
          <!-- <h2 id="stage-title">
            {{ hasArtwork ? 'Your pixel art is ready.' : 'Make pixels from a photo.' }}
          </h2> -->
          <div class="status-row" aria-live="polite">
            <span :class="['status-dot', status.type]" aria-hidden="true"></span
            ><span>{{ $t(status.label) }}</span>
          </div>
        </div>

        <localeButton v-if="!isPad" :value="showLocale" @show-option="(v) => showLocale = v" />
        <!-- <p v-if="imageDetails" class="image-details">{{ imageDetails }}</p> -->
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
        <!-- <button class="button primary" type="button" @click="emit('choose-image')">
          {{ hasArtwork ? 'Replace image' : 'Choose an image' }}
        </button> -->
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
      <customPalette
        v-if="openCustomPalette"
        @settings-changed="reprocessArtwork"
        @close="openCustomPalette = false"
      />
    </Transition>

    <Transition name="fade">
      <localeDialog
        v-if="showLocale"
        @close="showLocale = false"
      />
    </Transition>

    <footerSection v-if="isPad" />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, onMounted } from 'vue'
import PixelizationTools from '../components/PixelizationTools.vue'
import customPalette from '@/components/customPalette.vue'
import footerSection from '@/components/footerSection.vue'
import localeButton from '@/components/localeButton.vue'
import localeDialog from '@/components/localeDialog.vue'

import pixelApi from '../api/pixel'
import { storeToRefs } from 'pinia'
import { usePixelizationStore } from '../stores/pixelization'
import { useDefaultStore } from '@/stores/default.ts'
import { useI18n } from 'vue-i18n'

const settings = usePixelizationStore()
const defaultStore = useDefaultStore()

const { isPad } = storeToRefs(defaultStore)
const { setIsPad, setLocale } = defaultStore

const { t } = useI18n()

const showLocale = ref<boolean>(false)

const fileInput = ref<HTMLInputElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const sourceFile = ref<File | null>(null)
const isProcessing = ref(false)
const isDragging = ref(false)
const errorMessage = ref('')
// const imageDetails = ref('')
const openCustomPalette = ref(false)
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
} = storeToRefs(settings)

const openFilePicker = () => {
  fileInput.value?.click()
}

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
  if (sourceFile.value) {

    if (openCustomPalette.value) {
      return
    }

    processFile(sourceFile.value)
  }
}

const processFile = async(file: File) => {
  // if (!file.type.startsWith('image/')) {
  //   errorMessage.value = 'Choose an image file to begin.'
  //   return
  // }
  sourceFile.value = file
  errorMessage.value = ''
  isProcessing.value = true
  const form = new FormData()
  form.append('pixelSize', String(selectedSize.value))
  form.append('palette', selectedPalette.value)
  form.append('ditherStrength', String(ditherStrength.value))
  form.append('ditherStyle', String(selectedStyle.value))
  form.append('file', file)

  console.log(selectedPalette.value)
  console.log(selectedColors.value)

  if (selectedPalette.value === 'custom' && selectedColors.value.length > 0) {
    const customColors = selectedColors.value.join(';')
    form.append('customColors', customColors)
  }

  try {
    const result = await pixelApi.convert(form)
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

    await drawArtwork(result.data.data, result.data.width, result.data.height)

    console.log(`width: ${width}, height: ${height}`)
    // imageDetails.value = `${result.data.width} × ${result.data.height} px · ${settings.selectedSize}× blocks`
  } catch (error) {
    sourceFile.value = null
    errorMessage.value = t('error-failed')
    // console.error('Pixelization failed:', error)
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

const toggleCustomPalette = () => {
  openCustomPalette.value = true
}

const onResize = () => {
  setIsPad(window.innerWidth <= 899)
}

onMounted(() => {
  onResize()
  addEventListener('resize', onResize)

  const locale = localStorage.getItem('locale')

  if(locale){
    setLocale(locale)
  }
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
.actions{
  display: flex;
  justify-content: center;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  /* margin-top: 42px; */
  color: var(--px-text-muted);
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

:deep(.fade-enter-active),
:deep(.fade-leave-active) {
  transition: opacity 0.3s ease;
}

:deep(.fade-enter-from),
:deep(.fade-leave-to) {
  opacity: 0;
}
</style>
