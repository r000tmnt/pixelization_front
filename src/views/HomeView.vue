<template>

  <BCard>
    <BButtonGroup aria-label="像素化程度">
      <BButton
        v-for="size in pixelSize"
        :key="size.value"
        :variant="data.pixelSize === size.value ? 'success' : 'secondary'"
        @click="() => setPixelSize(size.value)">
        {{ size.text }}
      </BButton>
    </BButtonGroup>
  </BCard>

  <template v-if="!editMode">
    <BFormFile
      v-model="file"
      accept="image/*"
      label="Hello!"
    />
  </template>
  <template v-else>
    <input type="file" id="invisibleInput" style="display: none;" @change="(e) => {
      file = (e.target as HTMLInputElement).files?.[0] || null
    }" />
    <canvas id="myCanvas"
      :style="{'height': `${editMode ? 'auto' : '0px'}`}"
      @click="() => onCanvasClick()"
    ></canvas>
  </template>
</template>

<script setup lang="ts">
  import {ref, watch} from 'vue'
  import {BFormFile, BCard, BButtonGroup, BButton} from 'bootstrap-vue-next'
  import pixelApi from '../api/pixel'

  const { convert } = pixelApi

  const pixelSize = ref([
    { value: 2, text: '2X' },
    { value: 4, text: '4X' },
    { value: 6, text: '6X' },
    { value: 8, text: '8X' },
    // { value: 32, text: '32X' }
  ])

  const data = ref({
    pixelSize: 4,
  })

  const file = ref<File | null>(null)

  const editMode = ref<boolean>(false)

  const setPixelSize = async(size: number) => {
    data.value.pixelSize = size

    if(editMode.value && file){
      await convertAndDraw(file.value as File)
    }
  }

  const convertAndDraw = async(newFile: File) => {
      const form = new FormData()
      form.append('pixelSize', String(data.value.pixelSize))
      form.append('file', newFile)

      const result = await convert(form)

      console.log(result)

      if(result && result.data){
        editMode.value = true

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
      }else{
        editMode.value = false
      }
  }

  const onCanvasClick = () => {
    document.getElementById('invisibleInput')?.click();
  }

  watch(file, async(newFile) => {
    if(newFile) {
      await convertAndDraw(newFile)
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
