import { computed, unref } from 'vue'

const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL

function formatCardIdToPath(cardIdPrefix, cardId) {
  if (!cardId || typeof cardId !== 'string') {
    return null
  }
  const lowercasedId = cardId.toLowerCase()
  const lastHyphenIndex = lowercasedId.lastIndexOf('-')
  if (lastHyphenIndex === -1) {
    console.warn(`[useCardImage] Unexpected cardId format, cannot split: "${cardId}"`)
    return null
  }
  const suffix = lowercasedId.substring(lastHyphenIndex + 1)
  return `${cardIdPrefix}/${suffix}`
}

export const useCardImage = (cardIdPrefix, cardId) => {
  const imageUrl = computed(() => {
    const prefixValue = unref(cardIdPrefix)
    const cardIdValue = unref(cardId)

    const imagePath = formatCardIdToPath(prefixValue, cardIdValue)
    return imagePath ? `${imageBaseUrl}/${imagePath}.webp` : null
  })

  return imageUrl
}
