<template>
  <section class="wrapper" @click="emit('close')">
    <div class="content">
      <div class="dialog-header">
        <h3>Language</h3>
        <!-- <button class="close secondary" @click="emit('close')">X</button> -->
      </div>

      <div class="locale-options">
        <button v-for="id in list" :key="id"
          class="button"
          :class="`${lang === id? 'primary' : 'secondary'}`"
          @click.stop="setLocale(id)">
          {{ setDisplayLang(id) }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { list } from '@/locale/export';
import { useDefaultStore } from '@/stores/default';
import { storeToRefs } from 'pinia';

const defaultStore = useDefaultStore()
const { lang } = storeToRefs(defaultStore)
const { setLocale, setDisplayLang } = defaultStore

const emit = defineEmits<{'close': []}>()
</script>

<style scoped>
  .wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
  }

  .dialog-header {
    justify-content: center;
  }

  .content {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    /* min-width: 520px; */
    /* height: 30%; */
    background: var(--px-surface);
    border-radius: 8px;
    padding: 23px;
    padding-top: 1px
  }

  .locale-options{
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .button{
    width: fit-content;
    border: none;
  }
</style>
