import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/HomeView.vue'

const routes = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/CardDatabase',
    component: () => import('@/views/CardDatabaseView.vue'),
  },
  {
    path: '/DeckBuilder',
    component: () => import('@/views/DeckBuilderView.vue'),
  },
  {
    path: '/Decks',
    component: () => import('@/views/DecksView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
