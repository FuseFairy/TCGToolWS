import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUIStore = defineStore(
  'ui',
  () => {
    const theme = ref('system')

    function setTheme(newTheme) {
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
