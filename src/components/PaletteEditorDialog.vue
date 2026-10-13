<template>
  <div class="palette-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <section ref="dialog" class="palette-dialog custom-dialog" role="dialog" aria-modal="true" aria-labelledby="palette-editor-title" tabindex="-1">
      <header class="palette-header">
        <h2 id="palette-editor-title">{{ $t('edit-colors') }}</h2>
        <button class="close-button" type="button" :aria-label="$t('close')" @click="emit('close')">×</button>
      </header>
      <p class="palette-description">{{ $t('edit-colors-hint') }}</p>
      <div class="palette-list">
        <label v-for="(color, index) in colors" :key="index" class="palette-color">
          <span class="palette-swatch" :style="{ backgroundColor: color }"></span>
          <span>{{ $t('palette-color') }} {{ index + 1 }}</span>
          <input
            type="color"
            :value="color"
            :aria-label="$t('palette-color') + ' ' + (index + 1)"
            @change="(event) => emit('change-color', index, (event.target as HTMLInputElement).value)"
          />
          <code>{{ color.toUpperCase() }}</code>
        </label>
      </div>
      <footer class="palette-actions">
        <button type="button" :disabled="!canUndo" @click="emit('undo')">{{ $t('undo') }}</button>
        <button type="button" :disabled="!canRedo" @click="emit('redo')">{{ $t('redo') }}</button>
        <button class="done-button" type="button" @click="emit('close')">{{ $t('done') }}</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{
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

const dialog = ref<HTMLElement | null>(null)
onMounted(() => dialog.value?.focus())
</script>

<style scoped>
.palette-backdrop {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 76%);
}
.palette-dialog { width: min(100%, 460px); padding: 22px; }
.palette-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.palette-header h2 { margin: 0; font-size: 1.2rem; }
.close-button {
  width: 36px;
  height: 36px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--px-text);
  font: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}
.palette-description { margin: 12px 0 18px; color: var(--px-text-muted); font-size: 0.86rem; line-height: 1.5; }
.palette-list { display: grid; gap: 8px; max-height: min(55vh, 500px); overflow: auto; }
.palette-color {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 42px auto;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 6px 10px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  color: var(--px-text);
  font-size: 0.9rem;
}
.palette-swatch { width: 24px; height: 24px; border: 1px solid var(--px-grid); border-radius: 3px; }
.palette-color input { width: 38px; height: 32px; padding: 2px; border: 1px solid var(--px-grid); border-radius: 4px; background: transparent; cursor: pointer; }
.palette-color code { color: var(--px-text-muted); font-size: 0.76rem; }
.palette-actions { display: flex; gap: 8px; margin-top: 18px; }
.palette-actions button {
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface-raised);
  color: var(--px-text);
  font: inherit;
  cursor: pointer;
}
.palette-actions button:disabled { opacity: 0.45; cursor: default; }
.palette-actions .done-button { margin-left: auto; border-color: var(--px-violet); }
button:focus-visible,
input:focus-visible { outline: 2px solid var(--px-azure); outline-offset: 2px; }
</style>
