<!-- src/views/ForgotPasswordView.vue -->
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>忘记密码</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <p class="mb-4">请输入您的注册邮箱，我们将向您发送密码重置链接。</p>
            <v-alert v-if="message" :type="error ? 'error' : 'success'" density="compact" class="mb-4">{{ message
              }}</v-alert>
            <v-form @submit.prevent="handleSubmit">
              <v-text-field v-model="email" label="邮箱" prepend-inner-icon="mdi-email" type="email" variant="outlined"
                :readonly="loading"></v-text-field>
              <v-btn type="submit" block color="primary" size="large" :loading="loading">发送重置链接</v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text :to="{ name: 'Home' }" color="primary">返回首页</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const loading = ref(false);
const message = ref('');
const error = ref(false);
const authStore = useAuthStore();

const handleSubmit = async () => {
  loading.value = true;
  message.value = '';
  error.value = false;
  try {
    const response = await authStore.forgotPassword(email.value);
    message.value = response.message;
  } catch (e) {
    message.value = e.message;
    error.value = true;
  } finally {
    loading.value = false;
  }
};
</script>
