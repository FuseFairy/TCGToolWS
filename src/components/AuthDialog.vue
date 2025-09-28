<!-- src/components/AuthDialog.vue -->
<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-card :loading="loading" :title="isLoginMode ? '登入' : '注册'">
      <v-card-text>
        <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
        <v-alert v-if="successMessage" type="success" density="compact" class="mb-4">{{ successMessage }}</v-alert>
        <v-form @submit.prevent="submit">
          <v-text-field v-model="email" label="邮箱" type="email" variant="outlined"></v-text-field>
          <v-text-field v-model="password" label="密码" type="password" variant="outlined"
            autocomplete="off"></v-text-field>
          <v-text-field v-if="!isLoginMode" v-model="passwordConfirm" label="确认密码" type="password"
            variant="outlined"></v-text-field>
          <v-btn type="submit" block color="primary" size="large">{{ isLoginMode ? '登入' : '注册' }}</v-btn>
        </v-form>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn variant="text" @click="toggleMode">
          {{ isLoginMode ? '还没有帐号？点此注册' : '已有帐号？点此登入' }}
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
const mode = ref('login')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const error = ref(null)
const successMessage = ref(null)

const isLoginMode = computed(() => mode.value === 'login')

const submit = async () => {
  if (!isLoginMode.value && password.value !== passwordConfirm.value) {
    error.value = '两次输入的密码不一致。'
    return
  }

  loading.value = true
  error.value = null
  successMessage.value = null
  try {
    if (isLoginMode.value) {
      await authStore.login(email.value, password.value)
      dialog.value = false
    } else {
      const result = await authStore.register(email.value, password.value)
      successMessage.value = `${result.message}`
      mode.value = 'login'
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
  passwordConfirm.value = ''
  successMessage.value = null
}

const open = () => {
  dialog.value = true
  mode.value = 'login'
  email.value = ''
  passwordConfirm.value = ''
  password.value = ''
  error.value = null
  successMessage.value = null
}
defineExpose({ open })
</script>
