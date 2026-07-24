<template>
  <BFormFile
    v-if="!editMode"
    v-model="file"
    accept="image/*"
    label="Hello!"
  />

  <canvas id="myCanvas" v-else></canvas>
</template>

<script setup lang="ts">
  import {ref, watch} from 'vue'
  import {BFormFile} from 'bootstrap-vue-next'
  import pixelApi from '../api/pixel'

  const { convert } = pixelApi

  const file = ref<File | null>(null)

  const editMode = ref<boolean>(false)

  watch(file, async(newFile) => {
    editMode.value = newFile !== null

    if(newFile) {
      const form = new FormData()
      form.append('file', newFile)

      const result = await convert(form)

      console.log(result)

      const img = new Image();
      // img.crossOrigin = "anonymous";
      img.onload = function() {
        console.log('Image loaded:', img.width, img.height);
        const canvas = document.getElementById('myCanvas');
        // console.log(canvas)
        if(canvas instanceof HTMLCanvasElement) {
          const ctx = canvas.getContext('2d');

          const { width, height } = result.data;

          if(window.innerWidth > window.innerHeight) {
            canvas.width = Math.round(window.innerHeight * (width/height));
            canvas.height = window.innerHeight;
          } else {
            canvas.width = window.innerWidth;
            canvas.height = Math.round(window.innerWidth * (height/width));
          }

          // canvas.width = width;
          // canvas.height = height;


          // Draw image on canvas
          if(ctx){
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, width, height, 0 ,0, canvas.width, canvas.height);
          }

        }
      };

      img.onerror = (error) => console.error('Image failed to load.', error);

      img.src = result.data.data;
    }
  })
</script>

<style scoped>
canvas,
img {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}
</style>
