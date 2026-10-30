<template>
  <div class="privacy-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <section
      class="privacy-dialog custom-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      tabindex="-1"
    >
      <header class="privacy-header">
        <h2 id="privacy-title">{{ t('privacy-title') }}</h2>
        <button class="close-button" type="button" :aria-label="t('privacy-close')" @click="emit('close')">×</button>
      </header>

      <div class="privacy-content">
        <PrivacyPolicyContent />
      </div>

      <footer class="privacy-footer">
        <button class="button primary" type="button" @click="emit('close')">{{ t('done') }}</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PrivacyPolicyContent from '@/components/PrivacyPolicyContent.vue'

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>

<style scoped>
.privacy-backdrop {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 72%);
}
.privacy-dialog {
  display: flex;
  flex-direction: column;
  width: min(100%, 760px);
  max-height: min(88vh, 860px);
  overflow: hidden;
}
.privacy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px 18px;
  border-bottom: 1px solid var(--px-grid);
}
.privacy-header h2 { margin: 0; font-size: clamp(1.25rem, 3vw, 1.7rem); }
.close-button {
  flex: 0 0 auto;
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
.privacy-content { overflow-y: auto; padding: 16px 28px 24px; }
.privacy-footer { display: flex; justify-content: flex-end; padding: 14px 28px 20px; border-top: 1px solid var(--px-grid); }
.privacy-dialog button:focus-visible { outline: 2px solid var(--px-azure); outline-offset: 2px; }
@media (max-width: 600px) {
  .privacy-backdrop { padding: 12px; }
  .privacy-dialog { max-height: 92vh; }
  .privacy-header { padding: 18px 18px 14px; }
  .privacy-content { padding: 14px 18px 18px; }
  .privacy-footer { padding: 12px 18px 18px; }
  .privacy-footer button { width: 100%; }
}
</style>
