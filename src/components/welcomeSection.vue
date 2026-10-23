<template>
  <section class="welcome">
      <div class="title">
        <h1>Pixelization</h1>

        <SettingToggle
          style="margin-left: auto"
          @settings-changed="(v) => emit('show-settings', v)"
        />
      </div>

      <article class="description">
        <h2>A simple tool to pixelate images.</h2>
        <p>
          You can upload an image, adjust the pixelation settings, and download the result. Enjoy creating pixel art!
        </p>

        <h2>How to use</h2>

        <div class="steps">
          <p>
            1. Choose the size and palette.<br>
            The size determines how many pixels the image will be divided into, <br>
            and the palette determines the colors used in the pixelated image.
          </p>
          <img src="/scrn_shot/aside.png" alt="Choose size and palette" />
        </div>

        <div class="steps">
          <img src="/scrn_shot/upload.png" alt="Upload an image" />
          <p>
            2. Upload an image.<br>
            Supported formats: PNG, JPEG, GIF. The maximum file size is 5MB.
          </p>
        </div>
        <div class="steps">
          <p>
            3. Adjust the pixelation settings to your liking.<br>
            With edit mode, you can manually adjust the pixelation<br>
            by tools like magic wand and brush.
          </p>
          <img src="/scrn_shot/edit.png" alt="Adjust pixelation settings" />
        </div>
        <div class="steps">
          <p>
            4. Click "Download" to save the pixelated image.
          </p>
          <!-- <img src="/scrn_shot/download.png" alt="Download pixelated image" /> -->
        </div>

        <!-- <h2>Q&A</h2>
        <div class="qa">
          <p class="ans">
            <strong>Q: Can I use this tool for free?</strong><br>
            A: Yes, this tool is completely free to use.
          </p>
          <p class="ans">
            <strong>Q: Why am I not able to receive the pixelated image?</strong><br>
            A: Please ensure you have a stable internet connection and try again. If the issue persists, please contact support.
          </p>
        </div> -->


        <button @click="emit('close')">START PIXELIAZATION</button>
      </article>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
// import { computed } from 'vue';
// import { usePixelizationStore } from '../stores/pixelization'
import { useDefaultStore } from '@/stores/default.ts';

import SettingToggle from './SettingToggle.vue'

// const settings = usePixelizationStore()
const { isPad } = storeToRefs(useDefaultStore())

const emit = defineEmits<{
  'show-settings': [value: boolean],
  'close': []
}>()
</script>

<style scoped>
section {
  padding: 32px;
}

.title{
  display: flex;
  /* grid-template-columns: 1fr 1fr 1fr; */
}

.title > h1{
  width: fit-content;
  font-family: 'Pixelify Sans', var(--font-display);
  font-size: clamp(1.8rem, 3vw, 2.2rem);
  font-weight: 400;
  letter-spacing: -0.04em;
  margin: 0;
}

.description {
  text-align: center;
}

.steps {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 16px 0;
}

.steps > p {
  white-space: pre-line;
  text-align: left;
  line-height: 1.5;
}

img {
  max-width: 50%;
  max-height: 300px;
}

/* .qa {
  width: fit-content;
  margin: auto;
}

.ans {
  text-align: left;
} */
</style>
