<template>
  <router-view />
</template>

<script setup lang="ts">
  import { useDefaultStore } from './stores/default';
  import { storeToRefs } from 'pinia';
  import { useI18n } from 'vue-i18n'
  import { watch } from 'vue'

  const defaultStore = useDefaultStore()

  const { setScrollTop } = defaultStore
  const { lang } = storeToRefs(defaultStore)

  const { locale } = useI18n()

  const onScroll = () => {
    console.log('scroll', window.scrollY)



    setScrollTop(window.scrollY)
  }

  addEventListener('scroll', onScroll)

  watch(() => lang.value, (newLang) => {
    if(newLang){
      locale.value = newLang
    }
  })
</script>
