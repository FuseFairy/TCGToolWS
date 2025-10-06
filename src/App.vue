<template>
  <v-app id="app" class="grid-background">
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list class="py-0">
        <template v-for="item in navItems" :key="item.to">
          <v-list-item :to="{ name: item.name }" :title="item.text"></v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar scroll-behavior="elevate" scroll-threshold="160" :color="appBarColor" class="header">
      <template #prepend>
        <v-app-bar-nav-icon class="d-md-none" @click="drawer = !drawer"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title class="font-weight-bold text-h6 text-sm-h5">TCGTool for WS</v-app-bar-title>

      <template #append>
        <template v-if="!isInSpecialFlow">
          <div class="d-none d-md-block h-100">
            <template v-for="item in navItems" :key="item.to">
              <v-btn v-if="!item.requiresAuth || authStore.isAuthenticated" size="large" variant="text"
                :to="{ name: item.name }" :text="item.text" class="h-100 rounded-0"></v-btn>
            </template>
          </div>
          <v-divider class="mx-3 align-self-center d-none d-md-block" length="24" thickness="2" vertical></v-divider>
        </template>

        <v-btn @click="toggleTheme" icon="mdi-brightness-6"></v-btn>

        <template v-if="!isInSpecialFlow">
          <v-btn v-if="authStore.isAuthenticated" @click="handleLogoutClick" icon="mdi-logout" title="登出"></v-btn>
          <v-btn v-else @click="handleLogin" icon="mdi-login" title="登入/註冊"></v-btn></template>
      </template>
    </v-app-bar>

    <v-main :scrollable="true">
      <router-view v-slot="{ Component }">
        <v-fade-transition hide-on-leave>
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>

    <v-snackbar v-model="show" :color="color" timeout="3000" location="top">
      {{ text }}
    </v-snackbar>

    <AuthDialog ref="authDialog" />

    <v-dialog v-model="isLogoutDialogVisible" max-width="320" persistent>
      <v-card title="确认登出" text="您确定要登出目前的帐号吗？">
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text="取消" @click="isLogoutDialogVisible = false"></v-btn>
          <v-btn color="primary" variant="flat" text="确认" @click="confirmLogout"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, watchEffect, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSnackbar } from '@/composables/useSnackbar';
import AuthDialog from '@/components/AuthDialog.vue'


const authStore = useAuthStore()
const authDialog = ref(null)
const { show, text, color, triggerSnackbar } = useSnackbar();
const route = useRoute()

const isInSpecialFlow = computed(() => {
  return !!route.meta.isSpecialFlow;
})

const handleLogin = () => {
  authDialog.value?.open()
}

const isLogoutDialogVisible = ref(false)
const handleLogoutClick = () => {
  isLogoutDialogVisible.value = true
}

const confirmLogout = () => {
  authStore.logout()
  triggerSnackbar('您已成功登出。')
  isLogoutDialogVisible.value = false
}

const drawer = ref(false)
const navItems = [
  { text: '首页', name: 'Home', requiresAuth: false },
  { text: '系列卡表', name: 'SeriesCardTable', requiresAuth: false },
  { text: '我的卡组', name: 'Decks', requiresAuth: true }
]

const vuetifyTheme = useTheme()
const uiStore = useUIStore()

const appBarColor = computed(() => {
  return vuetifyTheme.global.name.value === 'light'
    ? 'grey-lighten-3'
    : 'grey-darken-3'
})

watchEffect(() => {
  vuetifyTheme.change(uiStore.theme)
})

const toggleTheme = () => {
  const newTheme = vuetifyTheme.global.current.value.dark ? 'light' : 'dark'
  uiStore.setTheme(newTheme)
}
</script>

<style scoped>
.header {
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/ui/ws-icon.svg');
  background-size: 165px;
  background-position: 1% 70%;
  background-repeat: no-repeat;
  z-index: -1;
}

.v-theme--dark.header::before {
  filter: brightness(0.5);
}
</style>
