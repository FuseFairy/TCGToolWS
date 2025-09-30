import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 初始化:從 storage 讀取
  const initState = () => {
    const local = localStorage.getItem('auth')
    const session = sessionStorage.getItem('auth')
    const stored = local || session
    if (stored) {
      const parsed = JSON.parse(stored)
      return { token: parsed.token, rememberMe: parsed.rememberMe ?? true }
    }
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
      storage.setItem('auth', JSON.stringify({ token: token.value, rememberMe: rememberMe.value }))
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

  return {
    token,
    isAuthenticated,
    rememberMe,
    sendVerificationCode,
    verifyAndRegister,
    login,
    logout,
  }
})
