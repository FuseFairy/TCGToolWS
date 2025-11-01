import { ref, watchEffect } from 'vue'
import ColorThief from 'colorthief'

export function useColorExtractor(imageUrl) {
  const colors = ref([])

  watchEffect((onCleanup) => {
    colors.value = [] // Reset colors when image changes
    if (!imageUrl.value) {
      return
    }

    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl.value

    let isCanceled = false
    onCleanup(() => {
      isCanceled = true
    })

    img.onload = () => {
      if (isCanceled) return

      try {
        const colorThief = new ColorThief()
        const palette = colorThief.getPalette(img, 7) // Extract 7 colors
        colors.value = palette.map(rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`)
      } catch (error) {
        console.error('Error extracting colors with ColorThief:', error)
        // Fallback to a default palette if extraction fails
        colors.value = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF']
      }
    }

    img.onerror = (error) => {
      if (isCanceled) return
      console.error('Error loading image for color extraction:', error)
      // Fallback to a default palette if image fails to load
      colors.value = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF']
    }
  })

  return { colors }
}
