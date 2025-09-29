import { computed, unref } from 'vue'

const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL

export const useCardImage = (cardPrefix, cardId) => {
  const imageUrl = computed(() => {
    const cardPrefixValue = unref(cardPrefix)
    const cardIdValue = unref(cardId)

    if (!cardIdValue || typeof cardIdValue !== 'string') {
      return null
    }

    const imageFilename = cardIdValue.replace('/', '-')

    return `${imageBaseUrl}/${cardPrefixValue}/${imageFilename}.webp`
  })

  return imageUrl
}
