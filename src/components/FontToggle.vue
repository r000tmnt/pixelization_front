<template>
  <label class="font-select">
    <span>{{ $t('font-label') }}</span>
    <select :value="readableFont ? 'readable' : 'pixel'" @change="changeFont">
      <option value="pixel">{{ $t('font-pixel') }}</option>
      <option value="readable">{{ $t('font-readable') }}</option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDefaultStore } from '@/stores/default'

const store = useDefaultStore()
const { readableFont } = storeToRefs(store)
const { setReadableFont } = store

const changeFont = (event: Event) => {
  setReadableFont((event.target as HTMLSelectElement).value === 'readable')
}
</script>

<style scoped>
.font-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--px-text-muted);
  font-size: 0.78rem;
  white-space: nowrap;
}
.font-select select {
  min-height: 36px;
  max-width: 135px;
  padding: 0 24px 0 9px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface-raised);
  color: var(--px-text);
  font: inherit;
  cursor: pointer;
}
.font-select select:focus-visible {
  outline: 2px solid var(--px-azure);
  outline-offset: 2px;
}
</style>
