import zhTW from './zh-tw.json'
import en from './en.json'
import jp from './jp.json'

import { createI18n } from 'vue-i18n'

const messages = {
  'us': en,
  'tw': zhTW,
  'jp': jp,
}

export const list = ['us', 'tw', 'jp']

export const i18n = createI18n({
  locale: 'us',
  legacy: false,
  allowComposition: true,
  fallbackLocale: 'tw',
  messages,
})
