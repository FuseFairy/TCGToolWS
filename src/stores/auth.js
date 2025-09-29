import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const token = ref(null)

  // --- Getters ---
  const isAuthenticated = computed(() => !!token.value)

  const sendVerificationCode = async (email, password) => {
    const response = await fetch('/api/register/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || '發送驗證碼失敗。')
    }
    return data
  }

  const verifyAndRegister = async (email, code) => {
    const response = await fetch('/api/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || '驗證失敗。')
    }
    return data
  }

  const login = async (email, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Login failed.')
    }
    token.value = data.token
    return data
  }

  const logout = () => {
    token.value = null
  }

  return {
    token,
    isAuthenticated,
    sendVerificationCode,
    verifyAndRegister,
    login,
    logout,
  }
})
