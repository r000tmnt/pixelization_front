<template>
  <div class="examples-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
    <section class="examples-dialog custom-dialog" role="dialog" aria-modal="true" aria-labelledby="examples-title" tabindex="-1">
      <header class="examples-header">
        <div>
          <h2 id="examples-title">{{ $t('examples-title') }}</h2>
          <p class="examples-intro">{{ $t('examples-description') }}</p>
        </div>
        <button class="close-button" type="button" :aria-label="$t('close')" @click="emit('close')">×</button>
      </header>

      <div class="examples-grid">
        <article v-for="example in examples" :key="example.id" class="example-card">
          <div class="example-image">
            <img :src="example.src" :alt="$t(example.nameKey)" />
          </div>
          <div class="example-card-footer">
            <div>
              <h3>{{ $t(example.nameKey) }}</h3>
              <p>{{ $t('label-color-' + example.palette) }}</p>
            </div>
            <button class="button secondary" type="button" @click="emit('select-example', example)">
              {{ $t('examples-try') }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  close: []
  'select-example': [example: { src: string; nameKey: string; palette: string }]
}>()

const examples = [
  { id: 'cat', src: '/test/test_01.jpg', nameKey: 'examples-cat', palette: 'gameboy' },
  { id: 'street', src: '/test/test_02.jpg', nameKey: 'examples-street', palette: 'nes' },
  { id: 'illustration', src: '/test/test_03.jpg', nameKey: 'examples-illustration', palette: 'snes' },
]
</script>

<style scoped>
.examples-backdrop { position: fixed; z-index: 30; inset: 0; display: grid; place-items: center; padding: 20px; background: rgb(0 0 0 / 72%); }
.examples-dialog { display: flex; flex-direction: column; width: min(100%, 1120px); max-height: min(90vh, 960px); min-height: 0; overflow: hidden; }
.examples-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 24px 28px 20px; border-bottom: 1px solid var(--px-grid); }
.eyebrow { margin: 0 0 6px; color: var(--px-azure); font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.08em; }
.examples-header h2 { margin: 0; font-size: clamp(1.3rem, 3vw, 1.8rem); }
.examples-intro { margin: 7px 0 0; color: var(--px-text-muted); line-height: 1.5; }
.close-button { flex: 0 0 auto; width: 36px; height: 36px; border: 1px solid var(--px-grid); border-radius: var(--radius-sm); background: transparent; color: var(--px-text); font: inherit; font-size: 1.5rem; line-height: 1; cursor: pointer; }
.examples-grid { display: grid; flex: 1 1 auto; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: max-content; align-content: start; gap: 18px; min-height: 0; overflow-y: auto; padding: 22px 28px 28px; }
.example-card { min-width: 0; overflow: hidden; border: 1px solid var(--px-grid); border-radius: var(--radius-sm); background: var(--px-surface-raised); }
.example-image { display: grid; aspect-ratio: 4 / 3; overflow: hidden; place-items: center; background: var(--px-ink); }
.example-image > img { display: block; width: 100%; height: 100%; object-fit: contain; }
.example-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px; }
.example-card-footer h3 { margin: 0; font-size: 0.95rem; }
.example-card-footer p { margin: 4px 0 0; color: var(--px-text-muted); font-size: 0.8rem; }
.example-card-footer button { flex: 0 0 auto; min-height: 36px; padding: 7px 10px; font-size: 0.8rem; }
.examples-dialog button:focus-visible { outline: 2px solid var(--px-azure); outline-offset: 2px; }
@media (max-width: 760px) { .examples-grid { grid-template-columns: 1fr; } .example-image { aspect-ratio: 16 / 10; } }
@media (max-width: 600px) { .examples-backdrop { padding: 12px; } .examples-header { padding: 18px; } .examples-grid { padding: 16px 18px 18px; } .example-card-footer { flex-wrap: wrap; } }
</style>
