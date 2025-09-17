import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/card-database',
    component: () => import('@/views/CardDatabaseView.vue'),
  },
  {
    path: '/deck-builder',
    component: () => import('@/views/DeckBuilderView.vue'),
  },
  {
    path: '/decks',
    component: () => import('@/views/DecksView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
