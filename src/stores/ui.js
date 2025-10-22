import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUIStore = defineStore(
  'ui',
  () => {
    const version = ref(1)
    const theme = ref('light')
    const isFilterOpen = ref(false)
    const isCardDeckOpen = ref(false)
    const isLoading = ref(false)
    const backgroundImage = ref(null)

    const setLoading = (status) => {
      isLoading.value = status
    }

    const setBackgroundImage = ({ canvas }) => {
      if (!canvas) return
      backgroundImage.value = {
        src: canvas.toDataURL(),
        width: canvas.width,
        height: canvas.height,
        maskOpacity: 0.3,
        blur: 0,
        size: 'cover',
      }
    }

    const setBackgroundMaskOpacity = (opacity) => {
      if (backgroundImage.value) {
        backgroundImage.value.maskOpacity = opacity
      }
    }

    const setBackgroundBlur = (blur) => {
      if (backgroundImage.value) {
        backgroundImage.value.blur = blur
      }
    }

    const setBackgroundSize = (size) => {
      if (backgroundImage.value) {
        backgroundImage.value.size = size
      }
    }

    const clearBackgroundImage = () => {
      backgroundImage.value = null
    }

    return {
      version,
      theme,
      isFilterOpen,
      isCardDeckOpen,
      isLoading,
      setLoading,
      backgroundImage,
      setBackgroundImage,
      clearBackgroundImage,
      setBackgroundMaskOpacity,
      setBackgroundBlur,
      setBackgroundSize,
    }
  },
  {
    persist: {
      storage: localStorage,
    },
  }
)
