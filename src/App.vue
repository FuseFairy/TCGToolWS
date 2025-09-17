<template>
  <v-app id="app">
    <v-app-bar>
      <v-app-bar-title>TCGTool for WS</v-app-bar-title>

      <template #append>
        <v-btn variant="text" to="/" text="首页"></v-btn>
        <v-btn variant="text" to="/card-database" text="图鉴"></v-btn>
        <v-btn variant="text" to="/deck-builder" text="组卡器"></v-btn>
        <v-btn variant="text" to="/decks" text="我的卡组"></v-btn>

        <v-divider class="mx-3 align-self-center" length="24" thickness="2" vertical></v-divider>

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
import { watchEffect } from 'vue'
import { useTheme } from 'vuetify'
import { useUIStore } from '@/stores/ui';

const vuetifyTheme = useTheme()
const uiStore = useUIStore()

watchEffect(() => {
  vuetifyTheme.change(uiStore.theme)
})

const toggleTheme = () => {
  const newTheme = vuetifyTheme.global.current.value.dark ? 'light' : 'dark'
  uiStore.setTheme(newTheme)
}
</script>

<style scoped></style>
