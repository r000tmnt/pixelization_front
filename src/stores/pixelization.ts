import { defineStore } from 'pinia'

export type Palette = {
  id: string
  name: string
  colours: string[]
}

export const usePixelizationStore = defineStore('pixelization', {
  state: () => ({
    pixelSizes: [2, 4, 6, 8],
    palettes: [
      {
        id: 'original',
        name: 'Original colour',
        colours: ['#fb7185', '#fbbf24', '#38bdf8', '#9d5cff'],
      },
      {
        id: 'gameboy',
        name: 'Game Boy',
        colours: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
      },
      {
        id: 'nes',
        name: 'NES',
        colours: ['#000000', '#0078f8', '#a80020', '#007800'],
      },
      {
        id: 'snes',
        name: 'SNES',
        colours: ['#2d5280', '#732866', '#f27961', '#b3b324'],
      },
      {
        id: '1bit',
        name: '1BIT',
        colours: ['#000000', '#ffffff', '#f2796100', '#b3b32400'],
      }
    ] as Palette[],
    selectedSize: 4,
    selectedPalette: 'original',
    selectedStyle: 'errorDiffusion',
    ditherStrength: 0.35,
    sizeLimitMB: 5,
    ditheringStyle: [
      {
        id: 'errorDiffusion',
        name: "Error diffusion",
      },
      {
        id: 'ordered',
        name: "Ordered"
      }
    ]
  }),
  getters: {
    activePalette: (state) =>
      state.palettes.find((palette) => palette.id === state.selectedPalette) ?? state.palettes[0]!,
  },
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
    }
  },
})
