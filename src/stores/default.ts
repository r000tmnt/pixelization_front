import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'

export const useDefaultStore = defineStore('default', {
  state: () => ({
    scrollTop: 0,
    isPad: false,
    lang: 'us'
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
    },
    setLocale (id: string) {
      this.lang = id
      localStorage.setItem('locale', id)

      const { locale } = useI18n()

      locale.value = id
    }
  }
})
