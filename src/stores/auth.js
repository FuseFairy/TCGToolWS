import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const codeVersion = 1

  // 初始化:從 storage 讀取
  const initState = () => {
    const local = localStorage.getItem('auth')
    const session = sessionStorage.getItem('auth')
    const stored = local || session
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Version check
        if (parsed.version === codeVersion) {
          return { token: parsed.token, rememberMe: parsed.rememberMe ?? true }
        }
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // Corrupted data, treat as invalid
        localStorage.removeItem('auth')
        sessionStorage.removeItem('auth')
      }
    }
    // If no stored value or version mismatch, return default
    return { token: null, rememberMe: true }
  }

  const { token: initToken, rememberMe: initRemember } = initState()
  const token = ref(initToken)
  const rememberMe = ref(initRemember)
  const isAuthenticated = computed(() => !!token.value)

  // 儲存到 storage
  const saveToStorage = () => {
    localStorage.removeItem('auth')
    sessionStorage.removeItem('auth')
    if (token.value) {
      const storage = rememberMe.value ? localStorage : sessionStorage
      storage.setItem(
        'auth',
        JSON.stringify({ token: token.value, rememberMe: rememberMe.value, version: codeVersion })
      )
    }
  }

  const sendVerificationCode = async (email, password) => {
    const response = await fetch('/api/register/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '發送驗證碼失敗。')
    return data
  }

  const verifyAndRegister = async (email, code) => {
    const response = await fetch('/api/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '驗證失敗。')
    return data
  }

  const login = async (email, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Login failed.')
    token.value = data.token
    saveToStorage()
    return data
  }

  const logout = () => {
    token.value = null
    localStorage.removeItem('auth')
    sessionStorage.removeItem('auth')
  }

  const refreshSession = async () => {
    if (!token.value) return

    try {
      const response = await fetch('/api/session/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
      const data = await response.json()
      if (response.ok && data.token) {
        token.value = data.token
        saveToStorage()
        console.log('Session refreshed successfully.')
      } else {
        logout()
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
      logout()
    }
  }

  const forgotPassword = async (email) => {
    const response = await fetch('/api/password/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || '请求失败，请稍后重试。')
    }
    return data
  }

  const resetPassword = async (token, password) => {
    const response = await fetch('/api/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || '密码重置失败。')
    }
    return data
  }

  watch(isAuthenticated, (isAuth, wasAuth) => {
    if (wasAuth && !isAuth) {
      const currentRoute = router.currentRoute.value
      if (currentRoute.meta.requiresAuth) {
        router.push({ name: 'Home' })
      }
    }
  })

  return {
    token,
    isAuthenticated,
    rememberMe,
    sendVerificationCode,
    verifyAndRegister,
    login,
    logout,
    refreshSession,
    forgotPassword,
    resetPassword,
  }
})
