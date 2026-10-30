import { defineStore } from 'pinia'

export const useDefaultStore = defineStore('default', {
  state: () => ({
    isPad: false,
    isMobile: false,
    lang: 'us',
    readableFont: false,
    theme: 'violet'
  }),
  actions: {
    setIsPad (isPad: boolean) {
      this.isPad = isPad
    },
    setIsMobile (isMobile: boolean) {
      this.isMobile = isMobile
    },
    setLocale (id: string) {
      this.lang = id
      if (typeof localStorage !== 'undefined') localStorage.setItem('locale', id)
    },
    setReadableFont (enabled: boolean) {
      this.readableFont = enabled
      if (typeof localStorage !== 'undefined') localStorage.setItem('readableFont', String(enabled))
    },
    setTheme (theme: string) {
      this.theme = theme
      if (typeof localStorage !== 'undefined') localStorage.setItem('theme', theme)
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
