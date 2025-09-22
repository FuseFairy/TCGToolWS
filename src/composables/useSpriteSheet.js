import { ref, watch } from 'vue'
import { loadSpriteSheet } from '@/services/spriteSheetService'

export const useSpriteSheet = (spriteName) => {
  const imageUrl = ref(null)
  const metadata = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  watch(
    spriteName,
    async (name, oldName, onInvalidate) => {
      if (!name) {
        imageUrl.value = null
        metadata.value = null
        return
      }

      let isCancelled = false
      onInvalidate(() => {
        isCancelled = true
      })

      isLoading.value = true
      error.value = null

      try {
        const result = await loadSpriteSheet(name)

        if (isCancelled) return

        imageUrl.value = result.imageUrl
        metadata.value = result.metadata
      } catch (e) {
        if (isCancelled) return

        console.error(`Failed to load sprite sheet: ${name}`, e)
        error.value = e
        imageUrl.value = null
        metadata.value = null
      } finally {
        if (!isCancelled) {
          isLoading.value = false
        }
      }
    },
    { immediate: true },
  )

  return { imageUrl, metadata, isLoading, error }
}
