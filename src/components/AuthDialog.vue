<!-- src/components/AuthDialog.vue -->
<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-card :loading="loading" :title="isLoginMode ? '登入' : '註冊'">
      <v-card-text>
        <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
        <v-alert v-if="successMessage" type="success" density="compact" class="mb-4">{{ successMessage }}</v-alert>
        <v-form @submit.prevent="submit">
          <v-text-field v-model="email" label="電子郵箱" type="email" variant="outlined"></v-text-field>
          <v-text-field v-model="password" label="密碼" type="password" variant="outlined"></v-text-field>
          <v-btn type="submit" block color="primary" size="large">{{ isLoginMode ? '登入' : '註冊' }}</v-btn>
        </v-form>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn variant="text" @click="toggleMode">
          {{ isLoginMode ? '還沒有帳號？點此註冊' : '已有帳號？點此登入' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const dialog = ref(false)
const mode = ref('login') // 'login' or 'register'
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)
const successMessage = ref(null)

const isLoginMode = computed(() => mode.value === 'login')

const submit = async () => {
  loading.value = true
  error.value = null
  successMessage.value = null
  try {
    if (isLoginMode.value) {
      await authStore.login(email.value, password.value)
      dialog.value = false // 登入成功，關閉對話框
    } else {
      const result = await authStore.register(email.value, password.value)
      successMessage.value = `${result.message} 請切換到登入頁面。`
      mode.value = 'login' // 註冊成功後自動切換到登入模式
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  mode.value = isLoginMode.value ? 'register' : 'login'
  error.value = null
  successMessage.value = null
}

// 暴露 open 方法給父組件調用
const open = () => {
  dialog.value = true
  mode.value = 'login'
  email.value = ''
  password.value = ''
  error.value = null
  successMessage.value = null
}
defineExpose({ open })
</script>
