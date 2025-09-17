import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUIStore = defineStore(
  'ui',
  () => {
    const theme = ref('system')

    const setTheme = (newTheme) => {
      theme.value = newTheme
    }

    return { theme, setTheme }
  },
  {
    persist: {
      storage: localStorage,
    },
  },
)
