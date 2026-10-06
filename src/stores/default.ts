import { defineStore } from 'pinia'

export const useDefaultStore = defineStore('default', {
  state: () => ({
    scrollTop: 0,
    isPad: false,
    lang: localStorage.getItem('locale') || 'us',
    readableFont: localStorage.getItem('readableFont') === 'true'
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
    setReadableFont (enabled: boolean) {
      this.readableFont = enabled
      localStorage.setItem('readableFont', String(enabled))
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
