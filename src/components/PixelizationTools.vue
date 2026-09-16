<template>
  <aside class="tool-rail" aria-label="Pixelization tools">
    <header class="brand-lockup">
      <!-- <p class="eyebrow">Creative image utility</p> -->
       <div class="title">
          <h1>Pixelization</h1>
          <small>v {{ version }}</small>
       </div>

      <p class="intro">{{ $t("title-desc") }}</p>
    </header>

    <div class="tool-stack">
      <section class="tool-section" aria-labelledby="pixel-size-title">
        <div class="section-heading">
          <p id="pixel-size-title" class="tool-label">{{ $t("label-pixel") }}</p>
          <!-- <output>{{ selectedSize }}×</output> -->
        </div>
        <div class="segmented-control" role="radiogroup" aria-label="Set pixel size"
        :style="{ gridTemplateColumns: `repeat(${pixelSizes.length}, 1fr)`}">
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
          <p id="palette-title" class="tool-label">{{ $t("label-palette") }}</p>
          <!-- <output>{{ activePalette.name }}</output> -->
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
            ><span>{{ $t(`label-color-${palette.id}`)  }}</span>
          </button>
        </div>
      </section>

      <Transition>
        <section
          class="tool-section"
          aria-labelledby="pixel-size-title"
          v-if="selectedPalette !== 'original'">
          <div class="section-heading">
            <p id="pixel-size-title" class="tool-label">{{ $t("label-dither") }}</p>
            <!-- <output>{{ selectedSize }}×</output> -->
          </div>
          <div class="segmented-control" role="radiogroup" aria-label="Set pixel size"
          :style="{ gridTemplateColumns: `repeat(${ditheringStyle.length}, 1fr)`}">
            <button
              v-for="style in ditheringStyle"
              :key="style.id"
              type="button"
              role="radio"
              :aria-checked="selectedStyle === style.id"
              :class="{ active: selectedStyle === style.id }"
              @click="changeDitheringStyle(style.id)"
            >
              {{ $t(`label-dither-${style.id}`) }}
            </button>
          </div>

          <div class="slider section-heading sub-tool" style="justify-content: space-between;">
            <label>{{ $t("label-dither-strength") }}</label>
            <input
              v-if="selectedStyle !== 'grid'"
              type="range"
              v-model="ditherStrength"
              min="0" max="1" step="0.05"
              @change="changeDitherStrength"
              style="width:100%"
            />

            <input
              v-else
              type="range"
              value="2"
              min="1" max="3" step="1"
              @change="changeDitherStrength"
              />

            <div>{{ ditherStrength }}</div>
          </div>
        </section>
      </Transition>
    </div>
    <footerSection
      v-if="!isPad"
      :style="{ position: 'absolute', bottom: 0 }"
    />
  </aside>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePixelizationStore } from '../stores/pixelization'
import { useDefaultStore } from '@/stores/default.ts';
import footerSection from './footerSection.vue';

defineProps<{
  hasArtwork: boolean
  isProcessing: boolean
}>()

const emit = defineEmits<{ 'choose-image': []; 'export-image': []; 'settings-changed': [], 'open-custom-palette': [] }>()

const settings = usePixelizationStore()
const { isPad } = storeToRefs(useDefaultStore())

const {
  palettes,
  pixelSizes,
  selectedPalette,
  selectedSize,
  selectedStyle,
  ditherStrength,
  ditheringStyle
} = storeToRefs(settings)

const version = import.meta.env.VITE_APP_VERSION


const changePixelSize = (size: number) => {
  if (selectedSize.value === size) return
  settings.setPixelSize(size)
  emit('settings-changed')
}

const changePalette = (palette: string) => {
  if(palette === 'custom') {
    emit('open-custom-palette')
  }

  if (selectedPalette.value === palette) return
  settings.setPalette(palette)

  emit('settings-changed')
}

const changeDitheringStyle = (style: string) => {
  if (selectedStyle.value === style) return
  settings.setDitherStyle(style)

  if(style === 'grid') {
    settings.setDitherStrength(4)
  }else{
    settings.setDitherStrength(0.35)
  }

  emit('settings-changed')
}

function changeDitherStrength(e: Event) {
  if(!e.target) return

  const strength = (e.target as HTMLInputElement).value

  if(selectedStyle.value === 'grid') {
    const value = Number(strength) - 1

    const step = [2, 4, 8]

    settings.setDitherStrength(step[value] as number)
  }else{
    settings.setDitherStrength(Number(strength))
  }

  emit('settings-changed')
}
</script>

<style scoped>
.title{
  display: flex;
  align-items: baseline;
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
  margin: 7px 10px 14px 0px;
  font-family: 'Pixelify Sans', var(--font-display);
  font-size: clamp(1.8rem, 3vw, 2.2rem);
  font-weight: 400;
  letter-spacing: -0.04em;
}
.eyebrow,
.tool-label,
output {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.8rem;
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
  /* .tool-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 28px;
  } */
  .actions {
    align-content: end;
  }
  .status-row {
    margin-top: 28px;
  }

  .tool-section{
    display: block;
  }

  .tool-section > .section-heading{
    margin: 10px 0;
  }

  .palette-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 620px) {
  .tool-stack {
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .palette-options {
    /* grid-template-columns: 1fr; */
    font-size: 0.9rem
  }
}

.v-enter-active{
  transition: all 0.5s ease-in-out;
  max-height: 150px;
}

.v-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 150px;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  max-height: 0px;
}
</style>
