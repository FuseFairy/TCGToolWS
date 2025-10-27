import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { jwtDecode } from 'jwt-decode'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

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
    path: '/series-card-table/:seriesId',
    name: 'SeriesDetail',
    component: () => import('@/views/SeriesDetailView.vue'),
    props: true,
  },
  {
    path: '/decks',
    name: 'Decks',
    component: () => import('@/views/DecksView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/decks/:key',
    name: 'DeckDetail',
    component: () => import('@/views/DeckDetailView.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/share-decks/:key',
    name: 'ShareDeckDetail',
    component: () => import('@/views/ShareDeckDetailView.vue'),
    props: true,
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { requiresGuest: true, isSpecialFlow: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPasswordView.vue'),
    props: (route) => ({ token: route.query.token }),
    meta: { requiresGuest: true, isSpecialFlow: true },
  },
  {
    path: '/search',
    name: 'GlobalSearch',
    component: () => import('@/views/GlobalSearchView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const authStore = useAuthStore()
  const token = authStore.token

  if (token) {
    try {
      const decodedToken = jwtDecode(token)
      const expiry = decodedToken.exp * 1000
      const oneDay = 24 * 60 * 60 * 1000

      // 檢查是否已過期或24小時內即將過期
      if (expiry < Date.now()) {
        authStore.logout()
      } else if (expiry < Date.now() + oneDay) {
        await authStore.refreshSession()
      }
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      authStore.logout()
    }
  }

  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)
  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Home' })
  } else if (requiresGuest && isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

// eslint-disable-next-line no-unused-vars
router.afterEach((to, from) => {
  const uiStore = useUIStore()
  if (to.name == 'GlobalSearch') {
    uiStore.isFilterOpen = true
  } else {
    uiStore.isFilterOpen = false
  }

  uiStore.isCardDeckOpen = false
  NProgress.done()
})

export default router
