<template>
  <div class="locale" @click="toggleOption">
    <country-flag :country='lang' size='small'/>
    <small class="tip">{{ displayLang }}</small>
  </div>
</template>

<script setup lang="ts">
import { useDefaultStore } from '@/stores/default';
import { storeToRefs } from 'pinia';
import CountryFlag from 'vue-country-flag-next'
import { ref, watch, onMounted } from 'vue';

const defaultStore = useDefaultStore()
const { lang } = storeToRefs(defaultStore)

const emit = defineEmits<{ 'show-option': [value: boolean] }>()

const showOption = ref<boolean>(false)
const displayLang = ref<string>('')

const toggleOption = () => {
  showOption.value = !showOption.value
  emit('show-option', showOption.value)
}

const setDisplayLang = (locale: string) => {
    switch(locale){
    case 'us':
      displayLang.value = 'ENGLISH'
    break;
    case 'tw':
      displayLang.value = '繁體中文'
    break;
    case 'jp':
      displayLang.value = '日本語'
    break;
  }
}

watch(() => lang.value, (newLang, oldLang) => {
  const locale = newLang.length? newLang : oldLang
  setDisplayLang(locale)
})

onMounted(() => {
  setDisplayLang(lang.value)
})
</script>

<style scoped>
  .locale{
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .tip{
    margin-left: 5px;
  }
</style>
