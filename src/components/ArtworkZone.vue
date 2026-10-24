<template>
  <section class="artwork-zone" aria-label="Artwork workspace">
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
      <button
        v-if="hasArtwork"
        class="examples-trigger examples-trigger-compact"
        type="button"
        @click="$emit('show-examples')"
      >
        {{ $t('examples-open') }}
      </button>
      <SettingToggle
        v-if="!isPad"
        @settings-changed="$emit('show-settings', $event)"
        @show-help="$emit('show-help', $event)"
      />
    </div>
    <div
      :class="['canvas-stage', { 'is-dragging': isDragging, 'has-artwork': hasArtwork }]"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <div v-if="!hasArtwork" class="empty-state">
        <button class="upload-zone" type="button" @click="openFilePicker">
          <span class="upload-icon" aria-hidden="true">+</span
          ><strong>{{ $t('upload-hint') }}</strong> <small>{{ $t('upload-type') }}</small
          ><small>{{ $t('upload-limit', { limit: sizeLimitMB }) }}</small>
        </button>
        <button class="examples-trigger" type="button" @click="$emit('show-examples')">
          {{ $t('examples-open') }}
        </button>
      </div>
      <div v-else class="canvas-wrap">
        <canvas
          ref="canvas"
          aria-label="Pixelized artwork"
          :class="{ 'is-comparing': isComparing }"
          @click="!isComparing && openFilePicker()"
        ></canvas>
        <div
          v-if="isComparing && hasConvertedArtwork && originalImageUrl"
          class="canvas-comparison"
          :style="comparisonStyle"
        >
          <img class="comparison-before" :src="originalImageUrl" :alt="$t('examples-before')" />
          <span class="comparison-label before-label">{{ $t('examples-before') }}</span>
          <span class="comparison-label after-label">{{ $t('examples-after') }}</span>
          <input
            :value="comparisonSplit"
            class="comparison-slider"
            type="range"
            min="0"
            max="100"
            :aria-label="$t('compare-slider-label')"
            @input="
              $emit('update:comparisonSplit', Number(($event.target as HTMLInputElement).value))
            "
          />
          <span class="comparison-divider" aria-hidden="true"></span>
        </div>
        <button v-if="!isComparing" class="replace-overlay" type="button" @click="openFilePicker">
          {{ $t('upload-change') }}
        </button>
      </div>
      <div v-if="isProcessing" class="processing-overlay" role="status">
        <span class="scan-line" aria-hidden="true"></span><span>{{ $t('status-process') }}</span>
      </div>
      <div v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</div>
    </div>
    <div
      class="actions output"
      aria-label="Image actions"
      :style="{ opacity: hasArtwork ? 1 : 0, transition: 'all 0.3 ease' }"
    >
      <button
        v-if="hasConvertedArtwork && !isProcessing"
        class="button secondary"
        type="button"
        :aria-pressed="isComparing"
        @click="$emit('toggle-comparison')"
      >
        {{ isComparing ? $t('compare-close') : $t('compare-open') }}
      </button>
      <button
        ref="previewButton"
        class="button secondary"
        type="button"
        :disabled="!hasArtwork || isProcessing"
        @click="$emit('preview')"
      >
        {{ $t('preview-edit') }}
      </button>
      <button
        class="button secondary"
        type="button"
        :disabled="!hasArtwork || isProcessing"
        @click="$emit('download')"
      >
        {{ $t('download') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SettingToggle from './SettingToggle.vue'

const props = defineProps<{
  hasArtwork: boolean
  isPad: boolean
  isProcessing: boolean
  hasConvertedArtwork: boolean
  isComparing: boolean
  comparisonSplit: number
  comparisonGeometry: { left: number; top: number; width: number; height: number }
  originalImageUrl: string
  errorMessage: string
  sizeLimitMB: number
  status: { type: string; label: string }
}>()
const emit = defineEmits<{
  (event: 'file-selected', file: File): void
  (event: 'show-examples' | 'toggle-comparison' | 'preview' | 'download'): void
  (event: 'show-settings' | 'show-help', value: boolean): void
  (event: 'update:comparisonSplit', value: number): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const previewButton = ref<HTMLButtonElement | null>(null)
const isDragging = ref(false)
const openFilePicker = () => fileInput.value?.click()
const comparisonStyle = computed(() => ({
  left: `${props.comparisonGeometry.left}px`,
  top: `${props.comparisonGeometry.top}px`,
  width: `${props.comparisonGeometry.width}px`,
  height: `${props.comparisonGeometry.height}px`,
  '--split': `${props.comparisonSplit}%`,
}))
const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('file-selected', file)
  input.value = ''
}
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) emit('file-selected', file)
}

defineExpose({ canvas, previewButton, openFilePicker })
</script>

<style scoped>
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
.canvas-stage {
  position: relative;
  display: grid;
  overflow: hidden;
  place-items: center;
  border: 1px solid var(--px-grid);
  background-color: var(--px-surface);
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
  background: color-mix(in srgb, var(--px-ink) 70%, transparent);
  color: var(--px-text);
  cursor: pointer;
}
.empty-state {
  display: grid;
  justify-items: center;
  gap: 12px;
  width: 100%;
  min-height: inherit;
  padding: 20px;
}
.examples-trigger {
  padding: 8px 12px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface);
  color: var(--px-azure);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}
.examples-trigger:hover {
  border-color: var(--px-azure);
}
.examples-trigger-compact {
  margin-left: auto;
  margin-right: -13px;
  height: 40px;
}
.upload-zone strong {
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
.canvas-wrap canvas.is-comparing {
  cursor: default;
}
.canvas-comparison {
  position: absolute;
  overflow: hidden;
  pointer-events: none;
}
.comparison-before {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  clip-path: inset(0 calc(100% - var(--split)) 0 0);
}
.comparison-label {
  position: absolute;
  z-index: 2;
  top: 12px;
  padding: 5px 8px;
  border-radius: 4px;
  background: rgb(0 0 0 / 72%);
  color: white;
  font-size: 0.75rem;
}
.before-label {
  left: 12px;
}
.after-label {
  right: 12px;
}
.comparison-slider {
  position: absolute;
  z-index: 4;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  appearance: none;
  background: transparent;
  pointer-events: auto;
  cursor: ew-resize;
}
.comparison-slider::-webkit-slider-thumb {
  width: 4px;
  height: 100%;
  appearance: none;
  background: var(--px-azure);
  box-shadow: 0 0 0 2px rgb(0 0 0 / 35%);
}
.comparison-slider::-moz-range-thumb {
  width: 4px;
  height: 100%;
  border: 0;
  border-radius: 0;
  background: var(--px-azure);
  box-shadow: 0 0 0 2px rgb(0 0 0 / 35%);
}
.comparison-divider {
  position: absolute;
  z-index: 3;
  top: 0;
  bottom: 0;
  left: var(--split);
  width: 2px;
  transform: translateX(-50%);
  background: var(--px-azure);
  pointer-events: none;
}
.replace-overlay {
  position: absolute;
  bottom: 18px;
  left: 50%;
  padding: 9px 12px;
  transform: translateX(-50%);
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--px-ink) 85%, transparent);
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
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
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
  .artwork-zone {
    padding: 24px;
  }
  .canvas-stage {
    min-height: 55vh;
  }
  .examples-trigger-compact {
    margin-right: unset;
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
  .canvas-stage {
    min-height: 46vh;
  }
  .replace-overlay {
    opacity: 1;
  }
}
</style>
