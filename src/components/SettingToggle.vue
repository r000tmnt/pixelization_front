<template>
  <button class="settings-trigger" type="button" :aria-label="$t('settings')" :title="$t('settings')" @click="() => handleSettingsChanged(true)">
    <GearIcon />
  </button>
</template>

<script setup lang="ts">
  import GearIcon from '@/icons/GearIcon.vue'

  const emit = defineEmits<{ 'settings-changed': [value: boolean] }>()

  const handleSettingsChanged = (value: boolean) => {
    emit('settings-changed', value)
  }
</script>

<style scoped>
.settings-trigger {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface);
  color: var(--px-text);
  cursor: pointer;
}
.settings-trigger:hover { border-color: var(--px-azure); color: var(--px-azure-bright); }
.settings-trigger svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
</style>
