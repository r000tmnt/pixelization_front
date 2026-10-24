<template>
  <div class="help-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <section
      class="help-dialog custom-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      tabindex="-1"
    >
      <header class="help-header">
        <div>
          <h2 id="help-title">{{ $t('help-title') }}</h2>
        </div>
        <button class="close-button" type="button" :aria-label="$t('help-close')" @click="emit('close')">×</button>
      </header>

      <div class="help-content">
        <p class="intro">{{ $t('help-intro') }}</p>
        <h3>{{ $t('help-how-to') }}</h3>

        <div class="steps">
          <div class="step-copy">
            <h4>{{ $t('help-step-1-title') }}</h4>
            <p>{{ $t('help-step-1-description') }}</p>
          </div>
          <img src="/scrn_shot/aside.png" :alt="$t('help-size-palette-alt')" />
        </div>

        <div class="steps">
          <div class="step-copy">
            <h4>{{ $t('help-step-2-title') }}</h4>
            <p>{{ $t('help-step-2-description') }}</p>
          </div>
          <img src="/scrn_shot/upload.png" :alt="$t('help-upload-alt')" />
        </div>

        <div class="steps">
          <div class="step-copy">
            <h4>{{ $t('help-step-3-title') }}</h4>
            <p>{{ $t('help-step-3-description') }}</p>
          </div>
          <img src="/scrn_shot/edit.png" :alt="$t('help-edit-alt')" />
        </div>

        <div class="steps final-step">
          <div class="step-copy">
            <h4>{{ $t('help-step-4-title') }}</h4>
            <p>{{ $t('help-step-4-description') }}</p>
          </div>
        </div>
      </div>

      <footer class="help-footer">
        <button class="button primary" type="button" @click="emit('close')">OK</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
</script>

<style scoped>
.help-backdrop {
  position: fixed;
  z-index: 30;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 72%);
}
.help-dialog {
  display: flex;
  flex-direction: column;
  width: min(100%, 760px);
  max-height: min(88vh, 860px);
  overflow: hidden;
}
.help-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px 18px;
  border-bottom: 1px solid var(--px-grid);
}
.help-eyebrow {
  margin: 0 0 6px;
  color: var(--px-azure);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}
.help-header h2 { margin: 0; font-size: clamp(1.25rem, 3vw, 1.7rem); }
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
.help-content { overflow-y: auto; padding: 20px 28px; }
.intro { margin: 0 0 22px; color: var(--px-text-muted); line-height: 1.6; }
.help-content > h3 { margin: 0 0 14px; font-size: 1.05rem; }
.steps {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 0.8fr);
  align-items: center;
  gap: 22px;
  padding: 18px 0;
  border-top: 1px solid var(--px-grid);
}
/* .steps.reverse img { order: -1; } */
.steps img { display: block; width: 100%; max-height: 220px; object-fit: contain; border: 1px solid var(--px-grid); border-radius: var(--radius-sm); }
.step-copy h4 { margin: 0 0 7px; font-size: 0.98rem; }
.step-copy p { margin: 0; color: var(--px-text-muted); font-size: 0.9rem; line-height: 1.55; }
.final-step { grid-template-columns: 1fr; }
.help-footer { display: flex; justify-content: flex-end; padding: 16px 28px 22px; border-top: 1px solid var(--px-grid); }
.help-dialog button:focus-visible { outline: 2px solid var(--px-azure); outline-offset: 2px; }
@media (max-width: 600px) {
  .help-backdrop { padding: 12px; }
  .help-dialog { max-height: 92vh; }
  .help-header { padding: 18px 18px 14px; }
  .help-content { padding: 16px 18px; }
  .steps { grid-template-columns: 1fr; gap: 12px; }
  .steps.reverse img { order: 0; }
  .steps img { max-height: 180px; }
  .help-footer { padding: 12px 18px 18px; }
  .help-footer button { width: 100%; }
}
</style>
