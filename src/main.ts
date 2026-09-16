import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import { i18n } from './locale/export.ts'

import './app.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const head = createHead()

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(head)

app.mount('#app')
