import { defineStore } from 'pinia'

export type Palette = {
  id: string
  name: string
  colors: string[]
}

export const usePixelizationStore = defineStore('pixelization', {
  state: () => ({
    pixelSizes: [2, 4, 6, 8],
    palettes: [
      {
        id: 'original',
        name: 'Original',
        colors: ['#fb7185', '#fbbf24', '#38bdf8', '#9d5cff'],
      },
      {
        id: 'gameboy',
        name: 'Game Boy',
        colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
      },
      {
        id: 'nes',
        name: 'NES',
        colors: ['#000000', '#0078f8', '#a80020', '#007800'],
      },
      {
        id: 'snes',
        name: 'SNES',
        colors: ['#2d5280', '#732866', '#f27961', '#b3b324'],
      },
      {
        id: '1bit',
        name: '1BIT',
        colors: ['#000000', '#ffffff', '#f2796100', '#b3b32400'],
      },
      {
        id: 'monochrome',
        name: 'Monochrome',
        colors: ['#000000', '#222222', '#444444', '#666666'],
      },
      {
        id: 'custom',
        name: 'Custom',
        //TODO:  Use the first 4 of chosen color
        colors: ['#f2796100', '#b3b32400', '#f2796100', '#b3b32400'],
      }
    ] as Palette[],
    acceptFileTypes: ['image/png', 'image/jpeg', 'image/webp'],
    ditheringStyle: [
      {
        id: 'default',
        name: "Diffusion",
      },
      {
        id: 'matted',
        name: "Matted"
      },
      {
        id: 'grid',
        name: "Grid"
      }
    ],
    selectedSize: 4,
    selectedPalette: 'original',
    selectedStyle: 'default',
    selectedColors: [] as string[],
    ditherStrength: 0.35,
    sizeLimitMB: 5,
  }),
  // getters: {
  //   activePalette: (state) =>
  //     state.palettes.find((palette) => palette.id === state.selectedPalette) ?? state.palettes[0]!,
  // },
  actions: {
    setPixelSize(size: number) {
      this.selectedSize = size
    },
    setPalette(palette: string) {
      this.selectedPalette = palette
    },
    setDitherStrength(strength: number) {
      this.ditherStrength = strength
    },
    setDitherStyle(style: string) {
      this.selectedStyle = style
    },
    setCustomColors(colors: string[]) {
      this.selectedColors = colors

      // console.log(colors)

      const customIndex = this.palettes.length - 1
      const customPalette = this.palettes[customIndex]

      if (!customPalette) return

      for (let i = 0; i < 4; i++) {
        const color = colors[i] ?? customPalette.colors[i] ?? '#00000000'
        customPalette.colors[i] = color
      }
    }
  },
})
