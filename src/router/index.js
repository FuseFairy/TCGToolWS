import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: { name: 'Home' },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/series-card-table',
    name: 'SeriesCardTable',
    component: () => import('@/views/SeriesCardTableView.vue'),
  },
  {
    path: '/series-card-table/:seriesName',
    name: 'SeriesDetail',
    component: () => import('@/views/SeriesDetailView.vue'),
    props: true,
  },
  {
    path: '/decks',
    name: 'Decks',
    component: () => import('@/views/DecksView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
