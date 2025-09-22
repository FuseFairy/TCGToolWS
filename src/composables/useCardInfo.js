import { ref, watchEffect } from 'vue'
import { getAssetsFile } from '@/utils/getAssetsFile.js'

const fileCache = new Map()

const findCardInData = (cardId, data) => {
  if (!cardId || !data) return null

  for (const baseId in data) {
    const cardData = data[baseId]
    if (!cardData.rarity || !Array.isArray(cardData.rarity)) continue

    for (const rarity of cardData.rarity) {
      const suffix = rarity.includes('-') ? rarity.split('-')[1] : rarity

      if (`${baseId}${suffix}` === cardId) {
        return cardData
      }
    }
  }

  return null
}

export const useCardInfo = (dataFileName, cardId) => {
  const cardInfo = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  watchEffect(async () => {
    const file = dataFileName.value
    const id = cardId.value

    if (!file || !id) {
      cardInfo.value = null
      return
    }

    isLoading.value = true
    error.value = null
    cardInfo.value = null

    try {
      let jsonData
      if (fileCache.has(file)) {
        jsonData = fileCache.get(file)
      } else {
        const jsonUrl = getAssetsFile(`card/data/${file}.json`)
        if (!jsonUrl) {
          throw new Error(`Data file not found for: ${file}`)
        }
        const response = await fetch(jsonUrl)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        jsonData = await response.json()
        fileCache.set(file, jsonData)
      }

      const foundCard = findCardInData(id, jsonData)
      cardInfo.value = foundCard
      if (!foundCard) {
        console.warn(`Card ID "${id}" not found in data file "${file}.json"`)
      }
    } catch (e) {
      console.error(`Failed to load card info for: ${id}`, e)
      error.value = e
    } finally {
      isLoading.value = false
    }
  })

  return { cardInfo, isLoading, error }
}
