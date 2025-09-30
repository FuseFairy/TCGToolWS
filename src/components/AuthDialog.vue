<template>
  <v-dialog v-model="dialog" max-width="400" persistent>
    <v-card :loading="loading">

      <!-- 視圖 1: 登入/註冊表單 -->
      <template v-if="step === 'credentials'">
        <v-card :title="isLoginMode ? '登入' : '注册'">
          <template #append>
            <v-btn icon="mdi-close" variant="text" @click="dialog = false"></v-btn>
          </template>
          <v-card-text>
            <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
            <v-form @submit.prevent="handleCredentialSubmit">
              <v-text-field v-model="email" label="邮箱" type="email" variant="outlined"
                :readonly="loading"></v-text-field>
              <v-text-field v-model="password" label="密码" type="password" variant="outlined" :readonly="loading"
                autocomplete="true"></v-text-field>

              <div v-if="isLoginMode" class="d-flex justify-space-between align-center mb-4">
                <v-checkbox v-model="authStore.rememberMe" label="保持登录" hide-details></v-checkbox>
                <v-btn variant="text" size="small" :to="{ name: 'ForgotPassword' }" @click="dialog = false">
                  忘记密码?
                </v-btn>
              </div>

              <v-text-field v-if="!isLoginMode" v-model="passwordConfirm" label="确认密码" type="password"
                variant="outlined" :readonly="loading"></v-text-field>
              <v-btn type="submit" block color="primary" size="large" :loading="loading">
                {{ isLoginMode ? '登录' : '发送验证码' }}
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn variant="text" @click="toggleMode" :disabled="loading">
              {{ isLoginMode ? '还没有帐号？点此注册' : '已有帐号？点此登入' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>

      <!-- 視圖 2: 驗證碼輸入表單 -->
      <template v-if="step === 'verification'">
        <v-card title="输入验证码">
          <template #append>
            <v-btn icon="mdi-close" variant="text" @click="dialog = false"></v-btn>
          </template>
          <v-card-text>
            <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
            <v-alert v-if="successMessage" type="success" density="compact" class="mb-4">{{ successMessage }}</v-alert>
            <p class="text-body-2 mb-4">我们已将 6 位数验证码发送到 <strong>{{ email }}</strong></p>
            <v-form @submit.prevent="handleVerificationSubmit">
              <v-otp-input v-model="verificationCode" :length="6"></v-otp-input>
              <v-btn type="submit" block color="primary" size="large" :loading="loading">验证并注册</v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn variant="text" @click="step = 'credentials'" :disabled="loading">返回</v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSnackbar } from '@/composables/useSnackbar';

const authStore = useAuthStore()
const { triggerSnackbar } = useSnackbar();

// --- 狀態定義 ---
const dialog = ref(false)
const step = ref('credentials') // 'credentials' 或 'verification'
const mode = ref('login') // 'login' 或 'register'


// 表單數據
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const verificationCode = ref('')

// UI 狀態
const loading = ref(false)
const error = ref(null)
const successMessage = ref(null)

const isLoginMode = computed(() => mode.value === 'login')

// --- 核心邏輯 ---
const handleCredentialSubmit = async () => {
  error.value = null
  if (!isLoginMode.value && password.value !== passwordConfirm.value) {
    error.value = '两次输入的密码不一致。'
    return
  }

  loading.value = true
  try {
    if (isLoginMode.value) {
      await authStore.login(email.value, password.value)
      dialog.value = false // 登入成功，直接關閉
      triggerSnackbar('登录成功！');
    } else {
      // 註冊流程：調用發送驗證碼的 action
      const result = await authStore.sendVerificationCode(email.value, password.value)
      successMessage.value = result.message
      step.value = 'verification' // 切換到下一步
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const handleVerificationSubmit = async () => {
  error.value = null
  loading.value = true
  try {
    const result = await authStore.verifyAndRegister(email.value, verificationCode.value)
    successMessage.value = `${result.message} 请登入。`
    mode.value = 'login'
    step.value = 'credentials' // 註冊成功，返回登入界面
    triggerSnackbar(result.message)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// --- 輔助函數 ---
const resetState = () => {
  step.value = 'credentials';
  mode.value = 'login';
  email.value = '';
  password.value = '';
  passwordConfirm.value = '';
  verificationCode.value = '';
  error.value = null;
  successMessage.value = null;
  loading.value = false;
}

const toggleMode = () => {
  mode.value = isLoginMode.value ? 'register' : 'login'
  error.value = null
  successMessage.value = null
}

const open = () => {
  resetState();
  dialog.value = true
}
defineExpose({ open })
</script>
