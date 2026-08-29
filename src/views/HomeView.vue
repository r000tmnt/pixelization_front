<template>
  <main class="workspace-shell">
    <aside class="tool-rail" aria-label="Pixelization tools">
      <header class="brand-lockup">
        <p class="eyebrow">Creative image utility</p>
        <h1>Pixelization</h1>
        <p class="intro">Turn a photograph into a deliberately pixelated artwork.</p>
      </header>
      <div class="tool-stack">
        <section class="tool-section" aria-labelledby="pixel-size-title">
          <div class="section-heading">
            <p id="pixel-size-title" class="tool-label">Pixel size</p>
            <output>{{ selectedSize }}×</output>
          </div>
          <div class="segmented-control" role="radiogroup" aria-label="Set pixel size">
            <button
              v-for="size in pixelSizes"
              :key="size"
              type="button"
              role="radio"
              :aria-checked="selectedSize === size"
              :class="{ active: selectedSize === size }"
              @click="setPixelSize(size)"
            >
              {{ size }}×
            </button>
          </div>
        </section>
        <section class="tool-section" aria-labelledby="palette-title">
          <div class="section-heading">
            <p id="palette-title" class="tool-label">Palette</p>
            <output>{{ activePalette.name }}</output>
          </div>
          <div class="palette-options" role="radiogroup" aria-label="Pick a palette">
            <button
              v-for="palette in palettes"
              :key="palette.id"
              type="button"
              role="radio"
              :aria-checked="selectedPalette === palette.id"
              :class="['palette-option', { active: selectedPalette === palette.id }]"
              @click="setPalette(palette.id)"
            >
              <span class="swatches" aria-hidden="true"
                ><i
                  v-for="colour in palette.colours"
                  :key="colour"
                  :style="{ backgroundColor: colour }"
                ></i></span
              ><span>{{ palette.name }}</span>
            </button>
          </div>
        </section>
        <section class="tool-section actions" aria-label="Image actions">
          <input
            ref="fileInput"
            class="visually-hidden"
            type="file"
            accept="image/*"
            aria-label="Choose an image to pixelize"
            @change="handleFileInput"
          /><button class="button primary" type="button" @click="openFilePicker">
            {{ hasArtwork ? 'Replace image' : 'Choose an image' }}</button
          ><button
            class="button secondary"
            type="button"
            :disabled="!hasArtwork || isProcessing"
            @click="downloadArtwork"
          >
            Export PNG
          </button>
        </section>
      </div>
      <div class="status-row" aria-live="polite">
        <span :class="['status-dot', status.type]" aria-hidden="true"></span
        ><span>{{ status.label }}</span>
      </div>
    </aside>
    <section class="artwork-zone" aria-labelledby="stage-title">
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
import pixelApi from '../api/pixel'
type Palette = { id: string; name: string; colours: string[] }
const pixelSizes = [2, 4, 6, 8]
const palettes: Palette[] = [
  {
    id: 'original',
    name: 'Original colour',
    colours: ['#fb7185', '#fbbf24', '#38bdf8', '#9d5cff'],
  },
  { id: 'gameboy', name: 'Game Boy', colours: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
]
const selectedSize = ref(4)
const selectedPalette = ref('original')
const fileInput = ref<HTMLInputElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const sourceFile = ref<File | null>(null)
const isProcessing = ref(false)
const isDragging = ref(false)
const errorMessage = ref('')
const imageDetails = ref('')
// Keep the canvas mounted during conversion so it is ready when the response arrives.
const hasArtwork = computed(() => sourceFile.value !== null)
const activePalette = computed(
  () => palettes.find((palette) => palette.id === selectedPalette.value) ?? palettes[0]!,
)
const status = computed(() =>
  isProcessing.value
    ? { type: 'processing', label: 'PROCESSING' }
    : errorMessage.value
      ? { type: 'error', label: 'ERROR' }
      : hasArtwork.value
        ? { type: 'ready', label: 'READY' }
        : { type: 'idle', label: 'AWAITING IMAGE' },
)
function openFilePicker() {
  fileInput.value?.click()
}
function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void processFile(file)
  input.value = ''
}
function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) void processFile(file)
}
function setPixelSize(size: number) {
  if (selectedSize.value === size) return
  selectedSize.value = size
  if (sourceFile.value) void processFile(sourceFile.value)
}
function setPalette(palette: string) {
  if (selectedPalette.value === palette) return
  selectedPalette.value = palette
  if (sourceFile.value) void processFile(sourceFile.value)
}
async function processFile(file: File) {
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Choose an image file to begin.'
    return
  }
  sourceFile.value = file
  errorMessage.value = ''
  isProcessing.value = true
  const form = new FormData()
  form.append('pixelSize', String(selectedSize.value))
  form.append('palette', selectedPalette.value)
  form.append('file', file)
  try {
    const result = await pixelApi.convert(form)
    if (!result?.data?.data || !result.data.width || !result.data.height)
      throw new Error('Invalid conversion response')
    await drawArtwork(result.data.data, result.data.width, result.data.height)
    imageDetails.value = `${result.data.width} × ${result.data.height} px · ${selectedSize.value}× blocks`
  } catch (error) {
    sourceFile.value = null
    errorMessage.value = 'We could not pixelize that image. Please try another file.'
    console.error('Pixelization failed:', error)
  } finally {
    isProcessing.value = false
  }
}
async function drawArtwork(dataUrl: string, width: number, height: number) {
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
function downloadArtwork() {
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
.tool-rail {
  position: sticky;
  top: 0;
  align-self: start;
  min-height: 100vh;
  padding: 32px 24px;
  border-right: 1px solid var(--px-grid);
  background: var(--px-surface);
}
.brand-lockup h1 {
  margin: 7px 0 14px;
  font-family: 'Pixelify Sans', var(--font-display);
  font-size: clamp(1.8rem, 3vw, 2.2rem);
  font-weight: 400;
  letter-spacing: -0.04em;
}
.eyebrow,
.tool-label,
.status-row,
output {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.eyebrow,
.tool-label {
  color: var(--px-azure);
}
.intro {
  max-width: 26ch;
  margin: 0;
  color: var(--px-text-muted);
  font-size: 0.92rem;
  line-height: 1.55;
}
.tool-stack {
  display: grid;
  gap: 27px;
  margin-top: 42px;
}
.tool-section {
  display: grid;
  gap: 10px;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
output {
  color: var(--px-text-muted);
}
.segmented-control {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface-raised);
}
button {
  font: inherit;
}
.segmented-control button {
  min-height: 38px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--px-text-muted);
  font-family: var(--font-mono);
  font-size: 0.82rem;
  cursor: pointer;
}
.segmented-control button.active {
  background: var(--px-violet);
  color: var(--px-ink);
  font-weight: 700;
}
.palette-options {
  display: grid;
  gap: 7px;
}
.palette-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 7px 9px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface-raised);
  color: var(--px-text);
  text-align: left;
  cursor: pointer;
}
.palette-option.active {
  border-color: var(--px-azure);
  box-shadow: inset 0 0 0 1px var(--px-azure);
}
.swatches {
  display: grid;
  grid-template-columns: repeat(4, 9px);
  gap: 2px;
}
.swatches i {
  width: 9px;
  height: 22px;
}
.actions {
  grid-template-columns: 1fr 1fr;
}
.button {
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-weight: 600;
  cursor: pointer;
}
.primary {
  border: 1px solid var(--px-violet);
  background: var(--px-violet);
  color: var(--px-ink);
}
.primary:hover {
  background: var(--px-violet-bright);
  border-color: var(--px-violet-bright);
}
.secondary {
  border: 1px solid var(--px-azure);
  background: transparent;
  color: var(--px-azure-bright);
}
.secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 42px;
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
@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
@media (prefers-reduced-motion: reduce) {
  .scan-line,
  .status-dot.processing {
    animation: none;
  }
  .replace-overlay {
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
  .tool-rail {
    position: static;
    min-height: auto;
    padding: 24px;
    border-right: 0;
    border-bottom: 1px solid var(--px-grid);
  }
  .tool-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 28px;
  }
  .actions {
    align-content: end;
  }
  .status-row {
    margin-top: 28px;
  }
  .artwork-zone {
    padding: 24px;
  }
  .canvas-stage {
    min-height: 55vh;
  }
}
@media (max-width: 620px) {
  .tool-stack {
    grid-template-columns: 1fr;
    gap: 22px;
  }
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
