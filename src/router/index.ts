import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import HelpPage from '../views/HelpPage.vue'
import PrivacyPage from '../views/PrivacyPage.vue'

export const routes = [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/help.html',
      name: 'HelpPage',
      component: HelpPage,
    },
    {
      path: '/privacy.html',
      name: 'PrivacyPage',
      component: PrivacyPage,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue'),
    }
]

export const createAppRouter = (history: RouterHistory = createWebHistory(import.meta.env.BASE_URL)) =>
  createRouter({ history, routes })
