<template>
  <p>
    404 NOT FOUND
  </p>
  <div>
    Return to home page after {{ sec }} seconds.
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const counter = ref<number>(0)
const sec = ref<number>(5)

onMounted(() => {
  counter.value = setInterval(() => {
    if(sec.value === 0){
      clearInterval(counter.value)
      router.push('/')
    }
    sec.value = sec.value - 1
  }, 1000)
})
</script>
