import { ref, watch } from 'vue'
import { getAssetsFile } from '@/utils/getAssetsFile.js'
import { findSeriesDataFileName } from '@/maps/series-card-map.js'

const cache = new Map()

export const useSeriesCards = (prefixesRef) => {
  const cards = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchData = async () => {
    const prefixes = prefixesRef.value
    if (!prefixes || prefixes.length === 0) {
      cards.value = []
      return
    }

    const cacheKey = prefixes.join(',')
    if (cache.has(cacheKey)) {
      cards.value = cache.get(cacheKey)
      isLoading.value = false // Ensure isLoading is false on cache hit
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const dataFilePaths = findSeriesDataFileName(prefixes)

      const allFileContents = await Promise.all(
        dataFilePaths.map(async (path) => {
          const url = getAssetsFile(path)
          const response = await fetch(url)
          if (!response.ok) throw new Error(`Failed to fetch ${path}`)
          return {
            content: await response.json(),
            spriteName: path.split('/').pop().replace('.json', ''),
          }
        }),
      )

      const allCards = []
      for (const file of allFileContents) {
        for (const baseId in file.content) {
          const cardData = file.content[baseId]

          // 根據稀有度展開成多張卡片
          cardData.rarity.forEach((rarity) => {
            const suffix = rarity.includes('-') ? rarity.split('-')[1] : rarity
            const fullCardId = `${baseId}${suffix}`

            allCards.push({
              ...cardData,
              id: fullCardId,
              baseId: baseId,
              spriteName: file.spriteName,
            })
          })
        }
      }

      cards.value = allCards
      cache.set(cacheKey, allCards)
    } catch (e) {
      console.error('Failed to load series cards:', e)
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  watch(prefixesRef, fetchData, { immediate: true })

  return { cards, isLoading, error }
}
