<template>
  <section class="wrapper">
    <div class="content">
        <button v-for="id in list" :key="id"
          class="button"
          :class="`${lang === id? 'primary' : 'secondary'}`"
          @click="setLocale(id)">
          {{ id.toUpperCase() }}
        </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { list } from '@/locale/export';
import { useDefaultStore } from '@/stores/default';
import { storeToRefs } from 'pinia';

const defaultStore = useDefaultStore()
const { lang } = storeToRefs(defaultStore)
const { setLocale } = defaultStore
</script>

<style scoped>
  .wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
  }

  .content {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30%;
    min-width: 520px;
    /* height: 30%; */
    background: var(--px-surface);
    border-radius: 4px;
    padding: 23px 2% 23px 2%;
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
