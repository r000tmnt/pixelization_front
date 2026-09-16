import { defineStore } from 'pinia'

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
    },
    setDisplayLang (locale: string) {
        switch(locale){
        case 'us':
          return 'ENGLISH'
        case 'tw':
          return '繁體中文'
        case 'jp':
          return '日本語'
        default:
          return ''
      }
    }
  }
})
