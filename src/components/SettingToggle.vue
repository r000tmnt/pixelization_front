<template>
  <div class="help-settings">
    <button class="help-button" type="button" :aria-label="$t('help-open')" :title="$t('help-open')" @click="() => emit('show-help', true)">?</button>

    <button class="settings-trigger" type="button" :aria-label="$t('settings')" :title="$t('settings')" @click="() => emit('settings-changed', true)">
      <GearIcon />
    </button>
  </div>
</template>

<script setup lang="ts">
  import GearIcon from '@/icons/GearIcon.vue'

  const emit = defineEmits<{ 'settings-changed': [value: boolean], 'show-help': [value: boolean] }>()

</script>

<style scoped>
.help-settings{
  display: flex;
  gap: 10px;
}
.help-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--px-grid);
  border-radius: 8px;
  background: var(--px-surface);
  color: var(--px-text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
}
.help-button:hover { border-color: var(--px-azure); color: var(--px-azure); }
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
