<template>
  <div class="help-content-body">
    <p class="intro">{{ t('help-intro') }}</p>
    <h2>{{ t('help-how-to') }}</h2>

    <section class="steps">
      <div class="step-copy">
        <h3>{{ t('help-step-1-title') }}</h3>
        <p>{{ t('help-step-1-description') }}</p>
      </div>
      <img src="/scrn_shot/aside.png" :alt="t('help-size-palette-alt')" />
    </section>

    <section class="steps">
      <div class="step-copy">
        <h3>{{ t('help-step-2-title') }}</h3>
        <p>{{ t('help-step-2-description') }}</p>
      </div>
      <img src="/scrn_shot/upload.png" :alt="t('help-upload-alt')" />
    </section>

    <section class="steps">
      <div class="step-copy">
        <h3>{{ t('help-step-3-title') }}</h3>
        <p>{{ t('help-step-3-description') }}</p>
      </div>
      <img src="/scrn_shot/edit.png" :alt="t('help-edit-alt')" />
    </section>

    <section class="steps final-step">
      <div class="step-copy">
        <h3>{{ t('help-step-4-title') }}</h3>
        <p>{{ t('help-step-4-description') }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.intro { margin: 0 0 22px; color: var(--px-text-muted); line-height: 1.6; }
h2 { margin: 0 0 14px; font-size: 1.05rem; }
.steps {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 0.8fr);
  align-items: center;
  gap: 22px;
  padding: 18px 0;
  border-top: 1px solid var(--px-grid);
}
.steps img { display: block; width: 100%; max-height: 240px; object-fit: contain; border: 1px solid var(--px-grid); border-radius: var(--radius-sm); }
.step-copy h3 { margin: 0 0 7px; font-size: 0.98rem; }
.step-copy p { margin: 0; color: var(--px-text-muted); font-size: 0.9rem; line-height: 1.55; }
.final-step { grid-template-columns: 1fr; }
@media (max-width: 600px) {
  .steps { grid-template-columns: 1fr; gap: 12px; }
  .steps img { max-height: 180px; }
}
</style>
