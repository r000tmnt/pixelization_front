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
const { setDisplayLang } = defaultStore

const props = defineProps({
  value: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits<{ 'show-option': [value: boolean] }>()

const showOption = ref<boolean>(false)
const displayLang = ref<string>('')

const toggleOption = () => {
  showOption.value = !props.value
  emit('show-option', showOption.value)
}

watch(() => lang.value, (newLang, oldLang) => {
  const locale = newLang.length? newLang : oldLang
  displayLang.value = setDisplayLang(locale)
})

onMounted(() => {
  displayLang.value = setDisplayLang(lang.value)
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
