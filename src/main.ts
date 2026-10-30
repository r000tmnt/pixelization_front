import { createHead } from '@unhead/vue/client'
import { createWebHistory } from 'vue-router'
import { createApplication } from './appFactory'

import './app.css'

const head = createHead()
const { app, router } = createApplication(createWebHistory(import.meta.env.BASE_URL), head)

router.isReady().then(() => app.mount('#app'))
