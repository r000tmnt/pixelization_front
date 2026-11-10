<template>
  <div class="export-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <section
      class="export-dialog custom-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
      tabindex="-1"
    >
      <header class="export-header">
        <h2 id="export-title">{{ $t('export-title') }}</h2>
        <button class="close-button" type="button" :aria-label="$t('close')" @click="emit('close')">×</button>
      </header>

      <div class="export-body">
        <section class="resolution-preview">
          <div class="target-res">
            <span class="res-value">{{ targetWidth }} × {{ targetHeight }}</span>
            <span class="res-unit">px</span>
            <span class="res-scale-badge">{{ selectedScale }}×</span>
          </div>
          <p class="original-note">
            {{ $t('export-original-size', { width: width, height: height }) }}
          </p>
        </section>

        <section class="scale-section">
          <label class="scale-label">{{ $t('export-scale-label') }}</label>
          <div class="scale-grid" role="radiogroup" :aria-label="$t('export-scale-label')">
            <button
              v-for="scale in scaleOptions"
              :key="scale"
              type="button"
              role="radio"
              :aria-checked="selectedScale === scale"
              :class="['scale-option', { active: selectedScale === scale }]"
              @click="selectedScale = scale"
            >
              <span class="scale-text">{{ scale }}×</span>
              <span v-if="scale === 8" class="rec-badge">{{ $t('export-recommended') }}</span>
            </button>
          </div>
        </section>

        <section class="support-card">
          <div class="support-text">
            <strong>{{ $t('export-support-title') }}</strong>
          </div>
          <KofiWidget />
        </section>
      </div>

      <footer class="export-footer">
        <button class="button secondary" type="button" @click="emit('close')">
          {{ $t('export-cancel-btn') }}
        </button>
        <button class="button primary" type="button" @click="handleExport">
          {{ $t('export-download-btn') }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import KofiWidget from '@/components/KofiWidget.vue'

const props = defineProps<{
  width: number
  height: number
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'export', scale: number): void
}>()

const scaleOptions = [1, 2, 4, 8, 16]
const selectedScale = ref<number>(8)

const targetWidth = computed(() => props.width * selectedScale.value)
const targetHeight = computed(() => props.height * selectedScale.value)

const handleExport = () => {
  emit('export', selectedScale.value)
}
</script>

<style scoped>
.export-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 75%);
  backdrop-filter: blur(2px);
}

.export-dialog {
  display: flex;
  flex-direction: column;
  width: min(100%, 460px);
  overflow: hidden;
}

.export-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--px-grid);
}

.export-header h2 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--px-text);
}

.close-button {
  background: transparent;
  border: 0;
  color: var(--px-text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.close-button:hover {
  color: var(--px-text);
}

.export-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
}

.resolution-preview {
  text-align: center;
  padding: 16px;
  background: var(--px-surface-raised, #201d36);
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm, 6px);
}

.target-res {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  font-family: var(--font-mono, monospace);
}

.res-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--px-text);
}

.res-unit {
  font-size: 0.9rem;
  color: var(--px-text-muted);
}

.res-scale-badge {
  padding: 2px 8px;
  border-radius: var(--radius-sm, 4px);
  background: var(--px-violet);
  color: var(--px-ink, #0b0a13);
  font-size: 0.8rem;
  font-weight: 700;
}

.original-note {
  margin: 6px 0 0;
  font-size: 0.82rem;
  color: var(--px-text-muted);
}

.scale-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scale-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--px-text-muted);
}

.scale-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.scale-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 6px 4px;
  background: var(--px-surface-raised, #201d36);
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm, 6px);
  color: var(--px-text);
  font-family: var(--font-mono, monospace);
  cursor: pointer;
  transition: all 0.15s ease;
}

.scale-option:hover {
  border-color: var(--px-azure);
}

.scale-option.active {
  background: var(--px-violet);
  border-color: var(--px-violet-bright);
  color: var(--px-ink, #0b0a13);
  font-weight: 700;
}

.scale-text {
  font-size: 0.95rem;
}

.rec-badge {
  position: absolute;
  top: -8px;
  padding: 1px 4px;
  font-size: 0.6rem;
  font-family: var(--font-body, sans-serif);
  border-radius: 3px;
  background: var(--px-azure);
  color: #0b0a13;
  font-weight: 700;
  white-space: nowrap;
}

.support-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px dashed var(--px-grid);
  border-radius: var(--radius-sm, 6px);
  background: color-mix(in srgb, var(--px-ink) 50%, transparent);
}

.support-text strong {
  display: block;
  font-size: 0.88rem;
  color: var(--px-text);
}

.export-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--px-grid);
}

@media (max-width: 480px) {
  .support-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>

