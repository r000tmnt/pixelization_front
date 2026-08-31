<template>
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
            @click="changePixelSize(size)"
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
            @click="changePalette(palette.id)"
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

        <div>
          <label>Change dithering level</label>
          <input
            type="range"
            v-model="ditherStrength"
            min="0" max="1" step="0.05"
            @change="changeDitherStrength"
            :disabled="selectedPalette === 'original'"
            />
        </div>
      </section>

      <section class="tool-section actions" aria-label="Image actions">
        <button class="button primary" type="button" @click="emit('choose-image')">
          {{ hasArtwork ? 'Replace image' : 'Choose an image' }}
        </button>
        <button
          class="button secondary"
          type="button"
          :disabled="!hasArtwork || isProcessing"
          @click="emit('export-image')"
        >
          Export PNG
        </button>
      </section>
    </div>

    <div class="status-row" aria-live="polite">
      <span :class="['status-dot', statusType]" aria-hidden="true"></span
      ><span>{{ statusLabel }}</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePixelizationStore } from '../stores/pixelization'

defineProps<{
  hasArtwork: boolean
  isProcessing: boolean
  statusType: string
  statusLabel: string
}>()

const emit = defineEmits<{ 'choose-image': []; 'export-image': []; 'settings-changed': [] }>()

const settings = usePixelizationStore()

const {
  activePalette,
  palettes,
  pixelSizes,
  selectedPalette,
  selectedSize,
  ditherStrength
} = storeToRefs(settings)

function changePixelSize(size: number) {
  if (selectedSize.value === size) return
  settings.setPixelSize(size)
  emit('settings-changed')
}

function changePalette(palette: string) {
  if (selectedPalette.value === palette) return
  settings.setPalette(palette)
  emit('settings-changed')
}

function changeDitherStrength(e: Event) {
  if(!e.target) return

  const strength = (e.target as HTMLInputElement).value

  settings.setDitherStrength(Number(strength))
  emit('settings-changed')
}
</script>

<style scoped>
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
button:focus-visible {
  outline: 2px solid var(--px-azure);
  outline-offset: 2px;
}
@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
@media (prefers-reduced-motion: reduce) {
  .status-dot.processing {
    animation: none;
  }
}
@media (max-width: 899px) {
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
}
@media (max-width: 620px) {
  .tool-stack {
    grid-template-columns: 1fr;
    gap: 22px;
  }
}
</style>
