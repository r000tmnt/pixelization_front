import { defineStore } from 'pinia'

export const useDefaultStore = defineStore('default', {
  state: () => ({
    scrollTop: 0
  }),
  getters: {
    activeScrollTop: (state) => {
      return state.scrollTop
    }
  },
  actions: {
    setScrollTop (scrollTop: number) {
      this.scrollTop = scrollTop
    }
  }
})
