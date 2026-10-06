<template>
  <p id="emoji">
     (◉ω◉)?
  </p>
  <p>
    404
  </p>
  <div>
    {{ t("404", { sec }) }}
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDefaultStore } from '@/stores/default'
import { storeToRefs } from 'pinia'

const { t, locale } = useI18n()
const router = useRouter()
const defaultStore = useDefaultStore()
const { readableFont } = storeToRefs(defaultStore)

const counter = ref<number>(0)
const sec = ref<number>(5)
const font = ref<string>('Pixelify Sans')

onMounted(() => {
  // console.log('Current locale:', locale.value)

  const storedLocale = localStorage.getItem('locale')
  if (storedLocale) {
    locale.value = storedLocale
  }

  if(readableFont.value) {
    font.value = 'var(--font-ui)'
  } else {
    font.value = 'Cubic_11'
  }

  // if(readableFont.value) {
  //   font.value = 'var(--font-ui)'
  // } else
  // if(storedLocale !== 'us') {
  //   font.value = 'BoutiqueBitmap9x9'
  // } else {
  //   font.value = 'Pixelify Sans'
  // }


  counter.value = setInterval(() => {
    if(sec.value === 0){
      clearInterval(counter.value)
      router.push('/')
    }else{
      sec.value = sec.value - 1
    }
  }, 1000)
})
</script>

<style scoped >
  p, div {
    font-family: v-bind(font), var(--font-display);
    font-size: 3rem;
    text-align: center;
  }

  #emoji {
    font-size: 5rem;
  }
</style>
