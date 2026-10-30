<template>
  <router-view id="view" />
</template>

<script setup lang="ts">
  import { useDefaultStore } from './stores/default';
  import { storeToRefs } from 'pinia';
  import { useI18n } from 'vue-i18n'
  import { watch, computed, onMounted } from 'vue'
  import { useHead, useSeoMeta } from '@unhead/vue';

  const defaultStore = useDefaultStore()

  const { setLocale, setReadableFont, setTheme } = defaultStore
  const { lang, readableFont, theme } = storeToRefs(defaultStore)

  const { locale, t } = useI18n()
  locale.value = lang.value

  const font = computed(() => readableFont.value
    ? 'var(--font-ui)'
    : 'Cubic_11' )

  const pageTitle = computed(() => t('title-html'))

  useHead({
    htmlAttrs: {
      lang: computed(() => lang.value === 'tw' ? 'zh-Hant' : lang.value === 'jp' ? 'ja' : 'en'),
      'data-theme': theme,
    },
  })

  useSeoMeta({
    title: pageTitle,
    description: 'Turn PNG, JPG, WEBP, and GIF images into pixel art with customizable palettes and crisp pixel edges.',
    ogDescription: 'Image to Pixel Art Converter.',
    ogTitle: 'PIXELIZATION',
    ogType: 'website',
  })

  onMounted(() => {
    const storedLocale = localStorage.getItem('locale')
    const storedFont = localStorage.getItem('readableFont')
    const storedTheme = localStorage.getItem('theme')
    if (storedLocale) setLocale(storedLocale)
    if (storedFont !== null) setReadableFont(storedFont === 'true')
    if (storedTheme) setTheme(storedTheme)
  })

  watch(() => lang.value, (newLang) => {
    if(newLang){
      locale.value = newLang
    }
  })
</script>

<style>
  #view {
    font-family: v-bind(font), var(--font-display);
  }
</style>
