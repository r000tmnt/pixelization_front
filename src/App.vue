<template>
  <router-view id="view" />
</template>

<script setup lang="ts">
  import { useDefaultStore } from './stores/default';
  import { storeToRefs } from 'pinia';
  import { useI18n } from 'vue-i18n'
  import { watch, computed, ref } from 'vue'
  import { useSeoMeta } from '@unhead/vue';

  const defaultStore = useDefaultStore()

  const { setScrollTop } = defaultStore
  const { lang } = storeToRefs(defaultStore)

  const { locale, t } = useI18n()

  const font = ref<string>('Pixelify Sans')

  const pageTitle = computed(() => t('title-html'))

  useSeoMeta({
    title: pageTitle,
    description: 'Turn PNG, JPG, WEBP, and GIF images into pixel art with customizable palettes and crisp pixel edges.',
    ogDescription: 'Image to Pixel Art Converter.',
    ogTitle: 'PIXELIZATION',
    ogType: 'website',
  })

  const onScroll = () => {
    // console.log('scroll', window.scrollY)
    setScrollTop(window.scrollY)
  }

  addEventListener('scroll', onScroll)

  watch(() => lang.value, (newLang) => {
    if(newLang){
      locale.value = newLang
    }

    if(newLang !== 'us') {
      font.value = 'BoutiqueBitmap9x9'
    } else {
      font.value = 'Pixelify Sans'
    }
  })
</script>

<style>
  #view {
    font-family: v-bind(font), var(--font-display);
  }
</style>
