<template>
  <!-- <h1>You did it!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p> -->
  <BApp>
    <router-view />
  </BApp>
</template>

<script setup lang="ts">
  import {BApp} from 'bootstrap-vue-next'

  // console.log(import.meta.env)
</script>

<style scoped></style>
