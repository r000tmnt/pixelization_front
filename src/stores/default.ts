import { defineStore } from 'pinia'

export const useDefaultStore = defineStore('default', {
  state: () => ({
    scrollTop: 0,
    isPad: false
  }),
  getters: {
    activeScrollTop: (state) => {
      return state.scrollTop
    }
  },
  actions: {
    setScrollTop (scrollTop: number) {
      this.scrollTop = scrollTop
    },
    setIsPad (isPad: boolean) {
      this.isPad = isPad
    }
  }
})
