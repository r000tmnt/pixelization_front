<template>
  <Transition name="fade">
    <div v-if="display" class="wrapper"
      :style="{ marginTop: `${scrollTop}px` }">
      <div class="content">
        <div class="palette-header">
          <h3>Custom Palette</h3>
          <button class="close secondary" @click="emit('close')">X</button>
        </div>

        <div class="slider">
          <label>Range of color</label>
          <input
            type="range"
            :min="2"
            :max="16"
            :step="1"
            :value="colors.length"
            @change="updateColorSlots" />
          <div>{{ colors.length }}</div>
        </div>

        <div class="color-grid">
          <div
            v-for="(color, index) in colors"
            :key="index"
            class="color-box"
            :style="{ backgroundColor: color }"
          >
            <input
              class="hidden"
              type="color"
              :value="color"
              @input="(e) => changeColor(e, index)" />
          </div>
        </div>

        <button
          @click="() => {
            setCustomColors(colors)
            emit('close')
            emit('settings-changed')
          }"
          class="save button primary"
          :disabled="colorMissing">
          Go
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { usePixelizationStore } from '../stores/pixelization'
  import { useDefaultStore } from '@/stores/default';
  import { ref, onMounted, onUnmounted, computed } from 'vue'

  const settings = usePixelizationStore()

  const defaultStore = useDefaultStore()

  const { scrollTop } = storeToRefs(defaultStore)

  // const { setScrollTop } = defaultStore

  defineProps<{
    display: boolean
  }>()

  const emit = defineEmits<{'settings-changed': [], 'close': []}>()

  const {
    selectedColors
  } = storeToRefs(settings)

  const { setCustomColors } = settings

  const colors = ref<string[]>([
    '#ffffff', '#ffffff'
  ])

  const colorMissing = computed(() => {
    const missing = colors.value.some(color => color.length === 0)
    return missing
  })

  const updateColorSlots = (e: Event) => {
    const target = e.target as HTMLInputElement
    const newLength = parseInt(target.value)

    if(newLength < colors.value.length) {
      colors.value = colors.value.slice(0, newLength)
    } else {
      while(colors.value.length < newLength) {
        colors.value.push('#ffffff')
      }
    }
  }

  const changeColor = (e: Event, index: number) => {
    const target = e.target as HTMLInputElement
    const newColor = target.value
    // console.log('New color selected:', newColor)
    // const newColor = prompt('Enter a new color in RGB format (e.g., 255,0,0 for red):')
    if (newColor) {
      colors.value[index] = newColor
    }
  }

  // const ifScrollTop = () => {
  //   if(window.innerWidth >= 899 && scrollTop.value > 0){
  //     setScrollTop(0)
  //   }
  // }

  onMounted(() => {
    if(selectedColors.value.length){
      colors.value = selectedColors.value.map(color => color)
    }

    // addEventListener('resize', ifScrollTop)

    document.body.style.overflow = 'hidden'
  })

  onUnmounted(() => {
    document.body.style.overflow = 'unset'
  })
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
    padding: 1% 2%;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
  }

  .palette-header{
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* margin-bottom: 20px; */
  }

  .close{
    cursor: pointer;
    border-radius: 8px;
  }

  .color-grid{
    display: grid;
    /* grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)); */
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    gap: 10px;
    padding: 20px 0;
  }

  .color-box {
    /* width: 50px; */
    height: 50px;
    border: 2px solid #ccc;
    border-radius: 8px;
    cursor: pointer;
  }

  .hidden{
    opacity: 0;
    width: 100%;
    height: 100%;
  }

  .save{
    width: 100%;
    margin-top: auto;
  }

  @media (max-width: 576px) {
    .content{
      min-width: 80%;
      padding: 2% 5%;
    }

    .color-grid{
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }
  }
</style>
