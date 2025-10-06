import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUIStore = defineStore(
  'ui',
  () => {
    const version = ref(1)
    const theme = ref('system')
    const isFilterOpen = ref(false)
    const isCardDeckOpen = ref(false)

    const setTheme = (newTheme) => {
      theme.value = newTheme
    }

    return { version, theme, setTheme, isFilterOpen, isCardDeckOpen }
  },
  {
    persist: {
      storage: localStorage,
    },
  }
)
