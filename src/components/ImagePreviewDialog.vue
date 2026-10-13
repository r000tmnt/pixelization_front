<template>
  <div class="preview-backdrop" @click.self="emit('close')">
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
          <button v-if="colors.length" class="palette-toggle" type="button" @click="showPalettePanel = !showPalettePanel">
            {{ showPalettePanel ? $t('hide-palette') : $t('show-palette') }}
          </button>
        </div>
        <div class="preview-controls">
          <button type="button" :aria-label="$t('zoom-out')" :disabled="zoom <= MIN_ZOOM" @click="zoomAtCenter(zoom - ZOOM_STEP)">−</button>
          <output aria-live="polite">{{ Math.round(zoom * 100) }}%</output>
          <button type="button" :aria-label="$t('zoom-in')" :disabled="zoom >= MAX_ZOOM" @click="zoomAtCenter(zoom + ZOOM_STEP)">+</button>
          <button type="button" @click="fitImage">{{ $t('fit') }}</button>
          <button type="button" @click="zoomAtCenter(1)">100%</button>
          <button class="close-button" type="button" :aria-label="$t('close')" @click="emit('close')">×</button>
        </div>
      </header>
      <div class="preview-workspace" :class="{ 'palette-open': showPalettePanel, 'has-palette': colors.length > 0 }">
        <aside v-if="colors.length" class="palette-drawer" :aria-label="$t('edit-colors')">
          <h3>{{ $t('edit-colors') }}</h3>
          <p class="palette-description">{{ $t('edit-colors-hint') }}</p>
          <div class="palette-list">
            <label v-for="(color, index) in colors" :key="index" class="palette-color">
              <span class="palette-swatch" :style="{ backgroundColor: color }"></span>
              <code>{{ color.toUpperCase() }}</code>
              <input
                type="color"
                :value="color"
                :aria-label="$t('palette-color') + ' ' + (index + 1)"
                @change="(event) => emit('change-color', index, (event.target as HTMLInputElement).value)"
              />
            </label>
          </div>
          <footer class="palette-actions">
            <button type="button" :disabled="!canUndo" @click="emit('undo')">{{ $t('undo') }}</button>
            <button type="button" :disabled="!canRedo" @click="emit('redo')">{{ $t('redo') }}</button>
          </footer>
        </aside>
        <div
        ref="viewport"
        class="preview-viewport"
        :class="{ 'is-panning': isPanning }"
        @wheel.prevent="handleWheel"
        @pointerdown="startPan"
        @pointermove="movePan"
        @pointerup="stopPan"
        @pointercancel="stopPan"
        >
          <img
          :src="src"
          :alt="$t('preview-image-alt')"
          :style="imageStyle"
          draggable="false"
            @load="onImageLoad"
          />
        </div>
      </div>
      <p class="preview-hint">{{ $t('preview-hint') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

defineProps<{
  src: string
  colors: string[]
  canUndo: boolean
  canRedo: boolean
}>()
const emit = defineEmits<{
  close: []
  'change-color': [index: number, color: string]
  undo: []
  redo: []
}>()

const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const ZOOM_STEP = 0.1
const dialog = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const zoom = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isPanning = ref(false)
const showPalettePanel = ref(false)
let fitDimensions = ''
let panPointerId: number | null = null
let lastPointerX = 0
let lastPointerY = 0

const imageStyle = computed(() => ({
  transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px)) scale(${zoom.value})`,
}))

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
  const picture = area?.querySelector('img')
  if (!area || !picture?.naturalWidth || !picture.naturalHeight) return
  const rect = area.getBoundingClientRect()
  // Fit may go below the manual zoom minimum for very large images.
  zoom.value = Math.min(1, rect.width / picture.naturalWidth, rect.height / picture.naturalHeight)
  offsetX.value = 0
  offsetY.value = 0
}

const onImageLoad = async (event: Event) => {
  const picture = event.target as HTMLImageElement
  const dimensions = `${picture.naturalWidth}x${picture.naturalHeight}`
  if (dimensions === fitDimensions) return
  fitDimensions = dimensions
  await fitImage()
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
  if (!isPanning.value || event.pointerId !== panPointerId) return
  offsetX.value += event.clientX - lastPointerX
  offsetY.value += event.clientY - lastPointerY
  lastPointerX = event.clientX
  lastPointerY = event.clientY
}

const stopPan = (event: PointerEvent) => {
  if (event.pointerId !== panPointerId) return
  isPanning.value = false
  panPointerId = null
}

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  showPalettePanel.value = window.innerWidth > 899
  dialog.value?.focus()
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
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
.preview-controls button {
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
.preview-controls button:disabled { opacity: 0.45; cursor: default; }
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
.palette-list { display: grid; gap: 7px; min-height: 0; overflow: auto; }
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
.preview-viewport img {
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
.preview-hint { margin: 10px 0 0; color: var(--px-text-muted); font-size: 0.78rem; text-align: center; }
button:focus-visible,
.preview-dialog:focus-visible,
.palette-color input:focus-visible { outline: 2px solid var(--px-azure); outline-offset: 2px; }
@media (max-width: 899px) {
  .preview-workspace { grid-template-columns: minmax(0, 1fr); }
  .palette-toggle { display: inline-flex; align-items: center; }
  .palette-drawer { display: none; }
  .preview-workspace.palette-open .palette-drawer {
    position: absolute;
    z-index: 2;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    max-height: 58%;
    box-shadow: 0 -12px 30px rgb(0 0 0 / 45%);
  }
}
@media (max-width: 620px) {
  .preview-header { align-items: flex-start; flex-direction: column; }
  .preview-controls { width: 100%; gap: 5px; }
  .preview-controls button { min-width: 32px; padding: 0 7px; }
  .preview-controls output { min-width: 40px; }
}
</style>
