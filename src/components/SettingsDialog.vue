<template>
  <div class="settings-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <section class="settings-dialog custom-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" tabindex="-1">
      <header class="settings-header">
        <h2 id="settings-title">{{ $t('settings') }}</h2>
        <button class="close-button" type="button" :aria-label="$t('close')" @click="emit('close')">×</button>
      </header>
      <div class="settings-fields">
        <FontToggle />
        <fieldset class="theme-select">
          <legend>{{ $t('theme-label') }}</legend>
          <button
            v-for="option in themes"
            :key="option.id"
            class="theme-option"
            :class="[`theme-${option.id}`, { selected: theme === option.id }]"
            type="button"
            :aria-pressed="theme === option.id"
            @click="setTheme(option.id)"
          >
            <span class="theme-preview" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
            <span>{{ $t(option.label) }}</span>
          </button>
        </fieldset>
        <section class="storage-settings">
          <label class="storage-toggle">
            <span>
              <strong>{{ $t('storage-remember') }}</strong>
              <small>{{ $t('storage-description') }}</small>
            </span>
            <input
              type="checkbox"
              :checked="rememberLastProject"
              @change="updateRememberPreference"
            />
          </label>
          <button class="delete-storage" type="button" :disabled="!hasSavedProject || isDeleting" @click="deleteSavedProject">
            {{ isDeleting ? $t('storage-deleting') : $t('storage-delete') }}
          </button>
          <p v-if="storageMessage" class="storage-message" role="status">{{ $t(storageMessage) }}</p>
        </section>
        <fieldset class="language-select">
          <legend>{{ $t('language') }}</legend>
          <button
            v-for="id in list"
            :key="id"
            class="locale-option"
            :class="{ selected: lang === id }"
            type="button"
            :aria-pressed="lang === id"
            @click="setLocale(id)"
          >
            <CountryFlag :country="id" size="small" />
            <span>{{ setDisplayLang(id) }}</span>
          </button>
        </fieldset>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import FontToggle from './FontToggle.vue'
import CountryFlag from 'vue-country-flag-next'
import { list } from '@/locale/export'
import { useDefaultStore } from '@/stores/default'
import { usePixelizationStore } from '@/stores/pixelization'
import { deleteRecentProject, getRecentProject } from '@/storage/recentProject'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{ close: [] }>()
const store = useDefaultStore()
const { lang } = storeToRefs(store)
const { theme } = storeToRefs(store)
const { setLocale, setDisplayLang, setTheme } = store
const themes = [
  { id: 'violet', label: 'theme-violet' },
  { id: 'mint', label: 'theme-mint' },
  { id: 'arcade', label: 'theme-arcade' },
  { id: 'light', label: 'theme-light' },
]
const pixelizationStore = usePixelizationStore()
const { rememberLastProject } = storeToRefs(pixelizationStore)
const hasSavedProject = ref(false)
const isDeleting = ref(false)
const storageMessage = ref('')
const updateRememberPreference = (event: Event) => {
  pixelizationStore.setRememberLastProject((event.target as HTMLInputElement).checked)
}

onMounted(async () => {
  try {
    hasSavedProject.value = Boolean(await getRecentProject())
  } catch {
    storageMessage.value = 'storage-error'
  }
})

const deleteSavedProject = async () => {
  isDeleting.value = true
  storageMessage.value = ''
  try {
    await deleteRecentProject()
    hasSavedProject.value = false
    storageMessage.value = 'storage-deleted'
  } catch {
    storageMessage.value = 'storage-error'
  } finally {
    isDeleting.value = false
  }
}

</script>

<style scoped>
.settings-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 72%);
}
.settings-dialog {
  width: min(100%, 380px);
  padding: 22px;
}
.settings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
.settings-header h2 { margin: 0; font-size: 1.2rem; }
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
.settings-fields { display: grid; gap: 18px; }
.theme-select { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0; padding: 0; border: 0; color: var(--px-text-muted); font-size: 0.85rem; }
.theme-select legend { grid-column: 1 / -1; margin-bottom: 10px; }
.theme-option { display: flex; align-items: center; gap: 9px; min-height: 44px; padding: 6px 9px; border: 1px solid var(--px-grid); border-radius: var(--radius-sm); background: var(--px-surface-raised); color: var(--px-text); font: inherit; text-align: left; cursor: pointer; }
.theme-option.selected { border-color: var(--px-violet-bright); box-shadow: inset 0 0 0 1px var(--px-violet-bright); }
.theme-preview { display: flex; flex: 0 0 36px; gap: 3px; height: 22px; padding: 4px; border: 1px solid var(--preview-grid); border-radius: 5px; background: var(--preview-bg); }
.theme-preview i { flex: 1; border-radius: 2px; background: var(--preview-accent); }
.theme-preview i:nth-child(2) { background: var(--preview-secondary); }
.theme-violet { --preview-bg: #151326; --preview-grid: #373252; --preview-accent: #9d5cff; --preview-secondary: #38bdf8; }
.theme-mint { --preview-bg: #182528; --preview-grid: #3d5b60; --preview-accent: #72f1b8; --preview-secondary: #6494aa; }
.theme-arcade { --preview-bg: #281820; --preview-grid: #603b42; --preview-accent: #ff8b39; --preview-secondary: #e43f3b; }
.theme-light { --preview-bg: #fffdf8; --preview-grid: #c9c1b4; --preview-accent: #3d6f83; --preview-secondary: #72f1b8; }
.storage-settings { display: grid; gap: 10px; }
.storage-toggle { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: var(--px-text); cursor: pointer; }
.storage-toggle span { display: grid; gap: 5px; }
.storage-toggle strong { font-size: 0.9rem; font-weight: 600; }
.storage-toggle small, .storage-message { color: var(--px-text-muted); font-size: 0.78rem; line-height: 1.45; }
.storage-toggle input { width: 18px; height: 18px; accent-color: var(--px-violet-bright); }
.delete-storage { justify-self: start; padding: 7px 10px; border: 1px solid var(--px-grid); border-radius: var(--radius-sm); background: var(--px-surface-raised); color: var(--px-text); font: inherit; font-size: 0.8rem; cursor: pointer; }
.delete-storage:disabled { opacity: 0.5; cursor: not-allowed; }
.storage-message { margin: 0; }
.language-select {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--px-text-muted);
  font-size: 0.85rem;
}
.language-select legend { margin-bottom: 10px; }
.locale-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--px-grid);
  border-radius: var(--radius-sm);
  background: var(--px-surface-raised);
  color: var(--px-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.locale-option.selected { border-color: var(--px-azure); }
button:focus-visible { outline: 2px solid var(--px-azure); outline-offset: 2px; }
</style>
