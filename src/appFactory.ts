import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import type { VueHeadClient } from '@unhead/vue/server'
import type { RouterHistory } from 'vue-router'
import { createLocaleInstance } from './locale/export'
import { createAppRouter } from './router'
import App from './App.vue'

export const createApplication = (history: RouterHistory, head: VueHeadClient) => {
  const app = createSSRApp(App)
  const router = createAppRouter(history)
  const pinia = createPinia()
  const i18n = createLocaleInstance()

  app.use(pinia)
  app.use(router)
  app.use(i18n)
  app.use(head)

  return { app, router, head }
}
