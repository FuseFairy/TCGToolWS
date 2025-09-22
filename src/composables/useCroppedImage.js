import { ref, watch, toValue, toRaw } from 'vue'
import { imageCache } from '@/services/ImageCache'
import imageProcessor from '@/utils/imageProcessor'

export function useCroppedImage(spriteImageUrl, spriteMetadata, cardId) {
  const croppedImageUrl = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  watch(
    () => [toValue(spriteImageUrl), toValue(cardId)],
    async ([url, id], _, onCleanup) => {
      onCleanup(() => {
        if (croppedImageUrl.value) {
          imageCache.release(croppedImageUrl.value)
          croppedImageUrl.value = null
        }
      })

      if (!url || !id || !toValue(spriteMetadata)) {
        return
      }

      isLoading.value = true
      error.value = null

      try {
        const metadata = toValue(spriteMetadata)
        const upperId = id.toUpperCase()
        const coords = metadata[upperId]

        if (!coords) {
          throw new Error(`Card ID "${upperId}" not found in metadata.`)
        }

        const plainCoords = toRaw(coords)
        const generator = () => imageProcessor.crop(url, plainCoords)

        const resultUrl = await imageCache.getOrGenerate(url, plainCoords, generator)

        croppedImageUrl.value = resultUrl
      } catch (e) {
        console.error(`Failed to process image for card ${id}:`, e)
        error.value = e
      } finally {
        isLoading.value = false
      }
    },
    { immediate: true },
  )

  return {
    croppedImageUrl,
    isLoading,
    error,
  }
}
