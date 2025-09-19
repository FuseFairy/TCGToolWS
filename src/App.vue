<template>
  <v-app id="app">
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list class="py-0">
        <template v-for="item in navItems" :key="item.to">
          <v-list-item :to="{ name: item.name }" :title="item.text"></v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar scroll-behavior="elevate" scroll-threshold="160" :color="appBarColor">
      <template #prepend>
        <v-app-bar-nav-icon class="d-md-none" @click="drawer = !drawer"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title class="font-weight-bold">TCGTool for WS</v-app-bar-title>

      <template #append>
        <div class="d-none d-md-block h-100">
          <template v-for="item in navItems" :key="item.to">
            <v-btn size="large" variant="text" :to="{ name: item.name }" :text="item.text"
              class="h-100 rounded-0"></v-btn>
          </template>
        </div>
        <v-divider class="mx-3 align-self-center d-none d-md-block" length="24" thickness="2" vertical></v-divider>
        <v-btn @click="toggleTheme" icon="mdi-brightness-6"></v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <router-view v-slot="{ Component }">
        <v-fade-transition hide-on-leave>
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, watchEffect, computed } from 'vue'
import { useTheme } from 'vuetify'
import { useUIStore } from '@/stores/ui';

const drawer = ref(false)
const navItems = [
  { text: '首页', name: 'Home' },
  { text: '系列卡表', name: 'SeriesCardTable' },
  { text: '我的卡组', name: 'Decks' }
]

const vuetifyTheme = useTheme()
const uiStore = useUIStore()

const appBarColor = computed(() => {
  return vuetifyTheme.global.name.value === 'light'
    ? 'grey-lighten-3'
    : 'grey-darken-2'
})

watchEffect(() => {
  vuetifyTheme.change(uiStore.theme)
})

const toggleTheme = () => {
  const newTheme = vuetifyTheme.global.current.value.dark ? 'light' : 'dark'
  uiStore.setTheme(newTheme)
}
</script>

<style scoped></style>
