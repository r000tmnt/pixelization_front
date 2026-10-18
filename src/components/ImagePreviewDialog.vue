<template>
  <div class="preview-backdrop" @click.self="finishEditing">
    <section
      ref="dialog"
      class="preview-dialog custom-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      tabindex="-1"
    >
      <header class="preview-header">
        <div class="preview-title-group">
          <h2 id="preview-title">{{ $t('preview-edit') }}</h2>

          <button
            v-if="isMobile"
            class="close-button"
            style="margin-left: auto;"
            type="button"
            :aria-label="$t('close')"
            @click="finishEditing">×</button>
        </div>
        <div class="preview-controls">
          <button type="button" :aria-label="$t('zoom-out')" :disabled="zoom <= MIN_ZOOM" @click="zoomAtCenter(zoom - ZOOM_STEP)">−</button>
          <output aria-live="polite">{{ Math.round(zoom * 100) }}%</output>
          <button type="button" :aria-label="$t('zoom-in')" :disabled="zoom >= MAX_ZOOM" @click="zoomAtCenter(zoom + ZOOM_STEP)">+</button>
          <button type="button" @click="fitImage">{{ $t('fit') }}</button>
          <button type="button" @click="zoomAtCenter(1)">100%</button>
          <button
            v-if="!isMobile"
            class="close-button"
            type="button"
            :aria-label="$t('close')"
            @click="finishEditing">×</button>
        </div>
      </header>
      <div class="preview-workspace" :class="{ 'palette-open': showPalettePanel, 'has-palette': true }">
        <aside id="palette-drawer" class="palette-drawer" :aria-label="$t(paletteMode === 'custom' ? 'label-custom' : 'edit-colors')">
          <button
            class="palette-toggle"
            type="button"
            :aria-label="$t('tool-handle')"
            :aria-expanded="showPalettePanel"
            aria-controls="palette-drawer"
            @click="showPalettePanel = !showPalettePanel"
          >
            <span>{{ $t('tool-handle') }}</span>
            <svg :class="{ open: showPalettePanel }" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6" /></svg>
          </button>
          <div class="palette-modes" role="tablist" :aria-label="$t('palette-edit-mode')">
            <button v-if="colors.length" type="button" role="tab" :aria-selected="paletteMode === 'image'" :class="{ active: paletteMode === 'image' }" @click="paletteMode = 'image'">{{ $t('edit-colors') }}</button>
            <button type="button" role="tab" :aria-selected="paletteMode === 'custom'" :class="{ active: paletteMode === 'custom' }" @click="paletteMode = 'custom'">{{ $t('label-custom') }}</button>
          </div>
          <template v-if="paletteMode === 'image'">
            <p class="palette-description">{{ $t('edit-colors-hint') }}</p>
            <div class="edit-tools" role="toolbar" :aria-label="$t('edit-tools')">
              <button type="button" :aria-label="$t('magic-wand')" :title="$t('magic-wand')" :aria-pressed="tool === 'wand'" :class="{ active: tool === 'wand' }" @click="tool = 'wand'">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 19 10-10 4 4L9 23H5zM14 4V1m6 5h3M4 8 2 6m16-1 2-2m-7 5 2 2" /><path d="M7 17h.01M17 10h.01" /></svg>
              </button>
              <button type="button" :aria-label="$t('brush')" :title="$t('brush')" :aria-pressed="tool === 'brush'" :class="{ active: tool === 'brush' }" @click="tool = 'brush'">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6 4 4M3 21c4 0 6-2 7-6L21 4l-3-3L7 12c-4 1-6 3-6 7 0 1 1 2 2 2Z" /></svg>
              </button>
              <button type="button" :aria-label="$t('eyedropper')" :title="$t('eyedropper')" :aria-pressed="tool === 'eyedropper'" :class="{ active: tool === 'eyedropper' }" @click="tool = 'eyedropper'">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 7 3 3M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16zM4 20H2v2" /></svg>
              </button>
              <button type="button" :aria-label="$t('hand')" :title="$t('hand')" :aria-pressed="tool === 'hand'" :class="{ active: tool === 'hand' }" @click="tool = 'hand'">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v7c0 5-3 8-8 8h-1c-2 0-3-1-4-2l-4-5a1.5 1.5 0 0 1 2-2z" /></svg>
              </button>
            </div>
            <label class="edit-control">
              <span>{{ $t('wand-tolerance') }}</span>
              <input v-model.number="tolerance" type="range" min="0" max="100" step="1" />
              <output>{{ tolerance }}</output>
            </label>
            <label class="edit-control">
              <span>{{ $t('brush-size') }}</span>
              <input v-model.number="brushSize" type="range" min="1" max="64" step="1" />
              <output>{{ brushSize }}px</output>
            </label>
            <label class="edit-control paint-color">
              <!-- <span>{{ $t('paint-color') }}</span> -->
              <input v-model="paintColor" type="color" :disabled="tool !== 'brush' || !selection" />
              <code>{{ paintColor.toUpperCase() }}</code>
            </label>
            <!-- <p class="selection-status" aria-live="polite">{{ selection ? $t('selection-ready') : $t('selection-instruction') }}</p> -->
            <footer class="palette-actions">
              <button type="button" :disabled="undoImages.length === 0 && !canUndo" @click="undoImages.length ? undoEdit() : emit('undo')">{{ $t('undo') }}</button>
              <button type="button" :disabled="redoImages.length === 0 && !canRedo" @click="redoImages.length ? redoEdit() : emit('redo')">{{ $t('redo') }}</button>
              <!-- <button type="button" :disabled="!selection" @click="clearSelection">{{ $t('deselect') }}</button> -->
            </footer>
          </template>
          <template v-else>
            <p class="palette-description">{{ $t('custom-palette-hint') }}</p>
            <label class="color-count">
              <span>{{ $t('label-custom-color') }}</span>
              <input type="range" min="2" max="16" step="1" :value="customDraft.length" @input="resizeCustomPalette" />
              <output>{{ customDraft.length }}</output>
            </label>
            <div class="palette-list custom-color-list">
              <label v-for="(color, index) in customDraft" :key="index" class="palette-color">
                <span class="palette-swatch" :style="{ backgroundColor: color }"></span>
                <code>{{ color.toUpperCase() }}</code>
                <input type="color" :value="color" :aria-label="$t('palette-color') + ' ' + (index + 1)" @input="(event) => updateCustomColor(event, index)" />
              </label>
            </div>
            <footer class="palette-actions">
              <button type="button" class="apply-custom" @click="emit('apply-custom', [...customDraft])">{{ $t('label-custom-apply') }}</button>
              <!-- <button type="button" :disabled="!canUndo" @click="emit('undo')">{{ $t('undo') }}</button>
              <button type="button" :disabled="!canRedo" @click="emit('redo')">{{ $t('redo') }}</button> -->
            </footer>
          </template>
        </aside>
        <div
        ref="viewport"
        class="preview-viewport"
        :aria-busy="isProcessing"
        :class="{ 'is-panning': isPanning, 'is-hand-tool': tool === 'hand' }"
        @wheel.prevent="handleWheel"
        @pointerdown="onViewportPointerDown"
        @pointermove="movePan"
        @pointerup="stopPan"
        @pointercancel="stopPan"
        >
          <canvas ref="editCanvas" class="edit-canvas" :aria-label="$t('preview-image-alt')" :style="imageStyle" @contextmenu.prevent />
          <canvas ref="selectionCanvas" class="selection-canvas" aria-hidden="true" :style="imageStyle" />
          <div v-if="isProcessing" class="processing-overlay" role="status">
            <span class="scan-line" aria-hidden="true"></span>
            <span>{{ $t('status-process') }}</span>
          </div>
        </div>
      </div>
      <p v-if="!isMobile && !isPad" class="preview-hint">{{ $t('preview-hint') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDefaultStore } from '@/stores/default'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  src: string
  colors: string[]
  selectedColors: string[]
  canUndo: boolean
  canRedo: boolean
  isProcessing: boolean
}>()
const emit = defineEmits<{
  close: []
  'save-artwork': [dataUrl: string]
  'change-color': [index: number, color: string]
  undo: []
  redo: []
  'apply-custom': [colors: string[]]
}>()

const defaultStore = useDefaultStore()
const { isMobile, isPad } = storeToRefs(defaultStore)

const MIN_ZOOM = 0.25
const MAX_ZOOM = 8
const ZOOM_STEP = 0.1
const dialog = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const editCanvas = ref<HTMLCanvasElement | null>(null)
const selectionCanvas = ref<HTMLCanvasElement | null>(null)
const zoom = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isPanning = ref(false)
const showPalettePanel = ref(false)
const paletteMode = ref<'image' | 'custom'>(props.colors.length ? 'image' : 'custom')
const tool = ref<'wand' | 'brush' | 'eyedropper' | 'hand'>('hand')
const tolerance = ref(24)
const brushSize = ref(12)
const paintColor = ref('#000000')
const selection = ref<Uint8Array | null>(null)
const undoImages = ref<ImageData[]>([])
const redoImages = ref<ImageData[]>([])
const undoSelections = ref<(Uint8Array | null)[]>([])
const redoSelections = ref<(Uint8Array | null)[]>([])
let imageLoadedSrc = ''
let brushPainting = false
let antOffset = 0
let antTimer: ReturnType<typeof setInterval> | undefined
const customDraft = ref<string[]>(props.selectedColors.length ? [...props.selectedColors] : ['#000000', '#ffffff'])
let panPointerId: number | null = null
let lastPointerX = 0
let lastPointerY = 0

const imageStyle = computed(() => ({
  transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px)) scale(${zoom.value})`,
}))

const loadEditorImage = async () => {
  if (!editCanvas.value || !props.src || imageLoadedSrc === props.src) return
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Preview image failed to load'))
    image.src = props.src
  })
  const target = editCanvas.value
  target.width = image.naturalWidth
  target.height = image.naturalHeight
  const context = target.getContext('2d')
  if (!context) return
  context.imageSmoothingEnabled = false
  context.drawImage(image, 0, 0)
  if (selectionCanvas.value) {
    selectionCanvas.value.width = target.width
    selectionCanvas.value.height = target.height
  }
  selection.value = null
  stopSelectionAnts()
  undoImages.value = []
  redoImages.value = []
  undoSelections.value = []
  redoSelections.value = []
  imageLoadedSrc = props.src
  drawSelection()
  await fitImage()
}

const drawSelection = () => {
  const target = selectionCanvas.value
  const mask = selection.value
  const ctx = target?.getContext('2d')
  if (!target || !ctx) return
  ctx.clearRect(0, 0, target.width, target.height)
  if (!mask) return
  const overlay = ctx.createImageData(target.width, target.height)
  if (tool.value === 'wand') {
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue
      const offset = i * 4
      overlay.data[offset] = 50
      overlay.data[offset + 1] = 30
      overlay.data[offset + 2] = 180
      overlay.data[offset + 3] = 75
    }
  }
  // Mark the selection edge in the same pixel buffer to keep large regions responsive.
  const w = target.width
  const h = target.height
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (!mask[i]) continue
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !mask[i - 1] || !mask[i + 1] || !mask[i - w] || !mask[i + w]) {
      const offset = i * 4
      const lightDash = Math.floor((x + y + antOffset) / 4) % 2 === 0
      overlay.data[offset] = lightDash ? 255 : 20
      overlay.data[offset + 1] = lightDash ? 255 : 20
      overlay.data[offset + 2] = lightDash ? 255 : 20
      overlay.data[offset + 3] = 255
    }
  }
  ctx.putImageData(overlay, 0, 0)
}

const rememberEdit = () => {
  const ctx = editCanvas.value?.getContext('2d')
  if (!editCanvas.value || !ctx) return
  undoImages.value.push(ctx.getImageData(0, 0, editCanvas.value.width, editCanvas.value.height))
  undoSelections.value.push(selection.value ? new Uint8Array(selection.value) : null)
  if (undoImages.value.length > 50) { undoImages.value.shift(); undoSelections.value.shift() }
  redoImages.value = []
  redoSelections.value = []
}

const restoreEdit = (image: ImageData, mask: Uint8Array | null) => {
  const ctx = editCanvas.value?.getContext('2d')
  if (!ctx) return
  ctx.putImageData(image, 0, 0)
  selection.value = mask ? new Uint8Array(mask) : null
  if (selection.value && !antTimer) startSelectionAnts()
  else if (!selection.value) stopSelectionAnts()
  drawSelection()
}

const undoEdit = () => {
  const ctx = editCanvas.value?.getContext('2d')
  const canvas = editCanvas.value
  const previous = undoImages.value.pop()
  if (!ctx || !canvas || !previous) return
  redoImages.value.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
  redoSelections.value.push(selection.value ? new Uint8Array(selection.value) : null)
  restoreEdit(previous, undoSelections.value.pop() ?? null)
}

const redoEdit = () => {
  const ctx = editCanvas.value?.getContext('2d')
  const canvas = editCanvas.value
  const next = redoImages.value.pop()
  if (!ctx || !canvas || !next) return
  undoImages.value.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
  undoSelections.value.push(selection.value ? new Uint8Array(selection.value) : null)
  restoreEdit(next, redoSelections.value.pop() ?? null)
}

const imagePoint = (event: PointerEvent) => {
  const area = viewport.value
  const canvas = editCanvas.value
  if (!area || !canvas) return null
  const rect = area.getBoundingClientRect()
  const scale = zoom.value
  const x = (event.clientX - (rect.left + rect.width / 2) - offsetX.value) / scale + canvas.width / 2
  const y = (event.clientY - (rect.top + rect.height / 2) - offsetY.value) / scale + canvas.height / 2
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null
  return { x: Math.floor(x), y: Math.floor(y) }
}

const selectRegion = (x: number, y: number) => {
  const canvas = editCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  const { width, height } = canvas
  const pixels = ctx.getImageData(0, 0, width, height).data
  const seed = (y * width + x) * 4
  const sr = pixels[seed]!, sg = pixels[seed + 1]!, sb = pixels[seed + 2]!
  const threshold = tolerance.value * 4.42
  const mask = new Uint8Array(width * height)
  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let head = 0, tail = 0
  const seedIndex = y * width + x
  queue[tail++] = seedIndex
  visited[seedIndex] = 1
  while (head < tail) {
    const index = queue[head++]!
    const p = index * 4
    const dr = pixels[p]! - sr, dg = pixels[p + 1]! - sg, db = pixels[p + 2]! - sb
    if (Math.sqrt(dr * dr + dg * dg + db * db) > threshold) continue
    mask[index] = 1
    const px = index % width
    const py = Math.floor(index / width)
    const neighbors = [px > 0 ? index - 1 : -1, px + 1 < width ? index + 1 : -1, py > 0 ? index - width : -1, py + 1 < height ? index + width : -1]
    for (const neighbor of neighbors) if (neighbor >= 0 && !visited[neighbor]) { visited[neighbor] = 1; queue[tail++] = neighbor }
  }
  rememberEdit()
  selection.value = mask
  startSelectionAnts()
  drawSelection()
}

const startSelectionAnts = () => {
  stopSelectionAnts()
  antOffset = 0
  antTimer = setInterval(() => {
    antOffset = (antOffset + 1) % 8
    drawSelection()
  }, 120)
}

const stopSelectionAnts = () => {
  if (antTimer) clearInterval(antTimer)
  antTimer = undefined
}

const paintAt = (x: number, y: number) => {
  const canvas = editCanvas.value
  const ctx = canvas?.getContext('2d')
  const mask = selection.value
  if (!canvas || !ctx) return
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  // Image points are pixel indices; paint around pixel centers. At 1 px this
  // makes the clicked source pixel the exact target instead of missing it.
  const centerX = x + 0.5
  const centerY = y + 0.5
  const radius = brushSize.value / 2
  const minX = Math.max(0, Math.floor(x - radius)), maxX = Math.min(canvas.width - 1, Math.ceil(x + radius))
  const minY = Math.max(0, Math.floor(y - radius)), maxY = Math.min(canvas.height - 1, Math.ceil(y + radius))
  const r = parseInt(paintColor.value.slice(1, 3), 16), g = parseInt(paintColor.value.slice(3, 5), 16), b = parseInt(paintColor.value.slice(5, 7), 16)
  for (let py = minY; py <= maxY; py++) for (let px = minX; px <= maxX; px++) {
    const dx = px + 0.5 - centerX, dy = py + 0.5 - centerY
    const index = py * canvas.width + px
    if (dx * dx + dy * dy > radius * radius || mask && !mask[index]) continue
    const offset = index * 4
    image.data[offset] = r; image.data[offset + 1] = g; image.data[offset + 2] = b; image.data[offset + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
}

const onViewportPointerDown = (event: PointerEvent) => {
  const point = imagePoint(event)
  if (point && paletteMode.value === 'image') {
    if (tool.value === 'wand') { selectRegion(point.x, point.y); return }
    if (tool.value === 'eyedropper') {
      const context = editCanvas.value?.getContext('2d')
      if (!context) return
      const pixel = context.getImageData(point.x, point.y, 1, 1).data
      paintColor.value = `#${[pixel[0], pixel[1], pixel[2]].map((channel) => channel!.toString(16).padStart(2, '0')).join('')}`
      tool.value = 'brush'
      return
    }
    if (tool.value === 'brush') {
      rememberEdit()
      brushPainting = true
      paintAt(point.x, point.y)
      viewport.value?.setPointerCapture(event.pointerId)
      return
    }
  }
  startPan(event)
}

const finishEditing = () => {
  if (editCanvas.value && imageLoadedSrc) emit('save-artwork', editCanvas.value.toDataURL('image/png'))
  emit('close')
}

const clearSelection = () => { rememberEdit(); selection.value = null; stopSelectionAnts(); drawSelection() }

const resizeCustomPalette = (event: Event) => {
  const length = Number((event.target as HTMLInputElement).value)
  customDraft.value = Array.from({ length }, (_, index) => customDraft.value[index] ?? '#ffffff')
}

const updateCustomColor = (event: Event, index: number) => {
  customDraft.value[index] = (event.target as HTMLInputElement).value
}

const clampZoom = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value))

const zoomAt = (value: number, clientX: number, clientY: number) => {
  const area = viewport.value
  if (!area) return
  const rect = area.getBoundingClientRect()
  const nextZoom = clampZoom(value)
  const pointerX = clientX - (rect.left + rect.width / 2)
  const pointerY = clientY - (rect.top + rect.height / 2)
  offsetX.value = pointerX - (pointerX - offsetX.value) * nextZoom / zoom.value
  offsetY.value = pointerY - (pointerY - offsetY.value) * nextZoom / zoom.value
  zoom.value = nextZoom
}

const zoomAtCenter = (value: number) => {
  const area = viewport.value
  if (!area) return
  const rect = area.getBoundingClientRect()
  zoomAt(value, rect.left + rect.width / 2, rect.top + rect.height / 2)
}

const handleWheel = (event: WheelEvent) => {
  zoomAt(zoom.value * (event.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP), event.clientX, event.clientY)
}

const fitImage = async () => {
  await nextTick()
  const area = viewport.value
  const picture = editCanvas.value
  if (!area || !picture?.width || !picture.height) return
  const rect = area.getBoundingClientRect()
  // Fit may go below the manual zoom minimum for large images, and can enlarge
  // small images up to the manual zoom maximum.
  zoom.value = Math.min(MAX_ZOOM, rect.width / picture.width, rect.height / picture.height)
  offsetX.value = 0
  offsetY.value = 0
}

const startPan = (event: PointerEvent) => {
  if (event.button !== 0 || !viewport.value) return
  isPanning.value = true
  panPointerId = event.pointerId
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  viewport.value.setPointerCapture(event.pointerId)
}

const movePan = (event: PointerEvent) => {
  if (brushPainting) {
    const point = imagePoint(event)
    if (point) paintAt(point.x, point.y)
    return
  }
  if (!isPanning.value || event.pointerId !== panPointerId) return
  offsetX.value += event.clientX - lastPointerX
  offsetY.value += event.clientY - lastPointerY
  lastPointerX = event.clientX
  lastPointerY = event.clientY
}

const stopPan = (event: PointerEvent) => {
  if (brushPainting) {
    brushPainting = false
    drawSelection()
    return
  }
  if (event.pointerId !== panPointerId) return
  isPanning.value = false
  panPointerId = null
}

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
  if (!(event.ctrlKey || event.metaKey)) return
  const key = event.key.toLowerCase()
  if (key === 'z' && event.shiftKey && redoImages.value.length) {
    event.preventDefault()
    event.stopPropagation()
    redoEdit()
  } else if (key === 'y' && redoImages.value.length) {
    event.preventDefault()
    event.stopPropagation()
    redoEdit()
  } else if (key === 'z' && undoImages.value.length) {
    event.preventDefault()
    event.stopPropagation()
    undoEdit()
  }
}

onMounted(() => {
  showPalettePanel.value = window.innerWidth > 899
  dialog.value?.focus()
  void loadEditorImage()
  window.addEventListener('keydown', onKeyDown, true)
})

watch(() => props.src, () => { imageLoadedSrc = ''; void loadEditorImage() })
watch(tool, drawSelection)
watch(() => props.selectedColors, (colors) => {
  customDraft.value = colors.length ? [...colors] : ['#000000', '#ffffff']
})
onUnmounted(() => {
  stopSelectionAnts()
  window.removeEventListener('keydown', onKeyDown, true)
})
</script>

<style scoped>
.preview-backdrop {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: grid;
  place-items: center;
  padding: clamp(10px, 3vw, 28px);
  background: rgb(0 0 0 / 82%);
}
.preview-dialog {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(100%, 1400px);
  height: min(100%, 900px);
  min-height: 0;
  padding: 14px;
}
.preview-header,
.preview-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-header {
  justify-content: space-between;
  gap: 16px;
  padding: 0 0 12px;
}
.preview-title-group { display: flex; align-items: center; gap: 12px; }
.preview-header h2 { margin: 0; font-size: 1.1rem; }
button {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface-raised);
  color: var(--px-text);
  font: inherit;
  cursor: pointer;
}
button:disabled { opacity: 0.45; cursor: default; }
.preview-controls output {
  min-width: 48px;
  color: var(--px-text-muted);
  font-family: var(--font-mono);
  text-align: center;
}
.preview-controls .close-button { font-size: 1.4rem; line-height: 1; }
.palette-toggle { display: none; }
.preview-workspace {
  position: relative;
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  gap: 12px;
}
.preview-workspace:not(.has-palette) { grid-template-columns: minmax(0, 1fr); }
.palette-drawer {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 14px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface);
}
.palette-drawer h3 { margin: 0; font-size: 1rem; }
.palette-description { margin: 8px 0 14px; color: var(--px-text-muted); font-size: 0.8rem; line-height: 1.45; }
.palette-modes { display: flex; gap: 6px; padding-bottom: 10px; border-bottom: 1px solid var(--px-grid); }
.palette-modes button { flex: 1; min-height: 34px; border: 1px solid var(--px-grid); border-radius: var(--radius-sm); background: var(--px-surface-raised); color: var(--px-text-muted); font: inherit; font-size: 0.78rem; cursor: pointer; }
.palette-modes button.active { border-color: var(--px-violet); color: var(--px-text); }
.color-count { display: grid; grid-template-columns: auto minmax(0, 1fr) 24px; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 0.8rem; }
.color-count output { color: var(--px-text-muted); text-align: right; }
.color-count input { min-width: 0; accent-color: var(--px-azure); }
.edit-tools { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; }
.edit-tools button { min-height: 38px; font-size: 0.82rem; }
.edit-tools button { display: grid; place-items: center; padding: 0; }
.edit-tools svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
.edit-tools button.active { border-color: var(--px-violet); background: var(--px-violet); color: var(--px-ink); font-weight: 700; }
.edit-tools button:disabled { opacity: 0.45; cursor: default; }
.edit-control { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 7px 10px; margin-top: 10px; color: var(--px-text-muted); font-size: 0.78rem; }
.edit-control input[type="range"] { grid-column: 1; width: 100%; accent-color: var(--px-azure); }
.edit-control output { grid-column: 2; grid-row: 2; min-width: 42px; text-align: right; font-variant-numeric: tabular-nums; }
.paint-color { grid-template-columns: auto 30px minmax(0, 1fr); }
.paint-color input { width: 30px; height: 30px; padding: 2px; border: 1px solid var(--px-grid); border-radius: 4px; background: transparent; }
.paint-color code { color: var(--px-text-muted); font-size: 0.72rem; }
.selection-status { min-height: 2.4em; margin: 0; color: var(--px-text-muted); font-size: 0.76rem; line-height: 1.4; }
.palette-list { display: grid; flex: 1; gap: 7px; min-height: 0; overflow: auto; }
.custom-color-list { grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: start; }
.palette-color {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 5px 7px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  color: var(--px-text);
  font-size: 0.8rem;
  cursor: pointer;
}
.palette-color:focus-within {
  border-color: var(--px-azure);
  box-shadow: 2px var(--px-azure);
}
.palette-swatch { width: 20px; height: 20px; border: 1px solid var(--px-grid); border-radius: 3px; }
.palette-color input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  opacity: 0;
  cursor: pointer;
}
.palette-color code { grid-column: 2 / 3; color: var(--px-text-muted); font-size: 0.7rem; }
.palette-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 12px; }
.palette-actions button,
.palette-toggle {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface-raised);
  color: var(--px-text);
  font: inherit;
  cursor: pointer;
}
.palette-actions button:disabled { opacity: 0.45; cursor: default; }
.palette-actions .apply-custom { width: 100%; border-color: var(--px-azure); background: var(--px-azure); color: var(--px-ink); }
.preview-viewport {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background-color: #0e0d18;
  background-image: linear-gradient(var(--px-grid) 1px, transparent 1px), linear-gradient(90deg, var(--px-grid) 1px, transparent 1px);
  background-size: 8px 8px;
  cursor: grab;
  touch-action: none;
}
.preview-viewport.is-panning { cursor: grabbing; }
.preview-viewport:has(.edit-canvas) { cursor: crosshair; }
.preview-viewport.is-hand-tool { cursor: grab; }
.preview-viewport.is-hand-tool.is-panning { cursor: grabbing; }
.preview-viewport .edit-canvas,
.preview-viewport .selection-canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  width: auto;
  max-width: none;
  max-height: none;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  pointer-events: none;
  user-select: none;
}
.preview-viewport .selection-canvas { z-index: 1; }
.preview-hint { margin: 10px 0 0; color: var(--px-text-muted); font-size: 0.78rem; text-align: center; }
button:focus-visible,
.preview-dialog:focus-visible,
.palette-color input:focus-visible { outline: 2px solid var(--px-azure); outline-offset: 2px; }
@media (max-width: 899px) {
  .preview-workspace { grid-template-columns: minmax(0, 1fr); }
  .palette-toggle {
    position: absolute;
    z-index: 5;
    top: -30px;
    left: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    /* min-width: 142px;
    min-height: 46px; */
    padding: 0 20px;
    border-radius: 12px 12px 0 0;
    /* border-color: var(--px-azure);
    background: var(--px-azure); */
    color: var(--px-text-muted);
    box-shadow: 0 4px 18px rgb(0 0 0 / 45%);
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%);
    width: 100%;
  }
  .palette-toggle svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
    transition: transform 200ms ease;
  }
  .palette-toggle svg.open {
    transform: rotate(180deg);
  }
  .palette-drawer {
    position: absolute;
    z-index: 2;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    /* max-height: min(66%, 65vh); */
    box-shadow: 0 -12px 30px rgb(0 0 0 / 45%);
    opacity: 1;
    pointer-events: none;
    transform: translateY(calc(100% - 1px));
    transition: transform 240ms ease;
  }
  .preview-workspace.palette-open .palette-drawer {
    pointer-events: auto;
    transform: translateY(0);
  }
}
@media (max-width: 620px) {
  .preview-header { align-items: flex-start; flex-direction: column; }
  .preview-title-group { width: 100%;  }
  .preview-controls { width: 100%; gap: 5px; }
  .preview-controls button { min-width: 32px; padding: 0 7px; }
  .preview-controls output { min-width: 40px; }
}
</style>
