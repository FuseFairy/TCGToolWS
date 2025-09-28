// src/stores/auth.js

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore(
  'auth',
  () => {
    // --- State ---
    const token = ref(null)

    // --- Getters ---
    const isAuthenticated = computed(() => !!token.value)

    // --- Actions ---
    async function register(email, password) {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.')
      }
      return data // 返回成功訊息
    }

    async function login(email, password) {
      const response = await fetch('/api/login', {
        // 假設你已經實現了登入 API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Login failed.')
      }
      // 登入成功，保存 token
      token.value = data.token
      return data
    }

    function logout() {
      token.value = null
    }

    return { token, isAuthenticated, register, login, logout }
  },
  {
    persist: {
      storage: localStorage,
    },
  }
)
