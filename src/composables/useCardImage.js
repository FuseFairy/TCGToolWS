import { computed } from 'vue'

const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL

function formatCardIdToPath(cardId) {
  if (!cardId || typeof cardId !== 'string') {
    return null
  }

  const lowercasedId = cardId.toLowerCase()

  const lastHyphenIndex = lowercasedId.lastIndexOf('-')
  if (lastHyphenIndex === -1) {
    console.warn(`[useCardImage] Unexpected cardId format, cannot split: "${cardId}"`)
    return null
  }

  const prefix = lowercasedId.substring(0, lastHyphenIndex)
  const suffix = lowercasedId.substring(lastHyphenIndex + 1)

  const transformedPrefix = prefix.replace(/\//g, '-')

  return `${transformedPrefix}/${suffix}`
}

export const useCardImage = (cardId) => {
  const imageUrl = computed(() => {
    const imagePath = formatCardIdToPath(cardId.value)

    return `${imageBaseUrl}/${imagePath}.webp`
  })

  return imageUrl
}
