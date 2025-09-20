import { computed } from 'vue'
import { useTheme } from 'vuetify'

/**
 * @description A composable that provides reactive scrollbar options based on the current Vuetify theme.
 * @returns {import('vue').ComputedRef<object>} A computed ref containing the scrollbar options.
 */
export const useDynamicScrollbarOptions = () => {
  const vuetifyTheme = useTheme()

  const dynamicScrollbarOptions = computed(() => {
    const isLightTheme = vuetifyTheme.global.name.value === 'light'

    return {
      scrollbars: {
        theme: isLightTheme ? 'os-theme-dark' : 'os-theme-light',
      },
      overflow: {
        x: 'scroll',
        y: 'scroll',
      },
    }
  })

  return dynamicScrollbarOptions
}
