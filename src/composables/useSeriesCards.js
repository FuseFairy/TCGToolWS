import { ref, watch } from 'vue'
import { getAssetsFile } from '@/utils/getAssetsFile.js'
import { findSeriesDataFileName } from '@/maps/series-card-map.js'

const cache = new Map()

export const useSeriesCards = (prefixesRef) => {
  const cards = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const productNames = ref([])
  const traits = ref([])
  const costRange = ref({ min: 0, max: 0 })
  const powerRange = ref({ min: 0, max: 0 })

  const fetchData = async () => {
    const prefixes = prefixesRef.value
    if (!prefixes || prefixes.length === 0) {
      cards.value = []
      return
    }

    const cacheKey = prefixes.join(',')
    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey)
      cards.value = cachedData.allCards
      productNames.value = cachedData.productNames
      traits.value = cachedData.traits
      costRange.value = cachedData.costRange
      powerRange.value = cachedData.powerRange
      isLoading.value = false
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const dataFilePaths = findSeriesDataFileName(prefixes)

      const allFileContents = await Promise.all(
        dataFilePaths.map(async (path) => {
          const url = getAssetsFile(path)
          const response = await fetch(url, { priority: 'high' })
          if (!response.ok) throw new Error(`Failed to fetch ${path}`)
          return {
            content: await response.json(),
            cardIdPrefix: path.split('/').pop().replace('.json', ''),
          }
        })
      )

      const allCards = []
      const productNamesSet = new Set()
      const traitsSet = new Set()
      let minCost = Infinity
      let maxCost = -Infinity
      let minPower = Infinity
      let maxPower = -Infinity

      for (const file of allFileContents) {
        for (const baseId in file.content) {
          const cardData = file.content[baseId]

          if (cardData.product_name) productNamesSet.add(cardData.product_name)
          if (cardData.trait && Array.isArray(cardData.trait))
            cardData.trait.forEach((t) => traitsSet.add(t))
          if (typeof cardData.cost === 'number') {
            minCost = Math.min(minCost, cardData.cost)
            maxCost = Math.max(maxCost, cardData.cost)
          }
          if (typeof cardData.power === 'number') {
            minPower = Math.min(minPower, cardData.power)
            maxPower = Math.max(maxPower, cardData.power)
          }

          const { all_cards, ...baseCardData } = cardData

          if (all_cards && Array.isArray(all_cards)) {
            all_cards.forEach((cardVersion) => {
              allCards.push({
                ...baseCardData,
                ...cardVersion,
                baseId: baseId,
                cardIdPrefix: file.cardIdPrefix,
              })
            })
          }
        }
      }

      const baseIdToFullIdsMap = new Map()
      for (const card of allCards) {
        if (!baseIdToFullIdsMap.has(card.baseId)) {
          baseIdToFullIdsMap.set(card.baseId, [])
        }
        baseIdToFullIdsMap.get(card.baseId).push(card.id)
      }

      for (const card of allCards) {
        if (card.link && Array.isArray(card.link) && card.link.length > 0) {
          card.link = card.link.flatMap((linkBaseId) => {
            const fullIds = baseIdToFullIdsMap.get(linkBaseId)
            if (fullIds && fullIds.length > 0) {
              return fullIds
            }
            if (import.meta.env.DEV) {
              console.warn(
                `Could not find any full IDs for linked baseId "${linkBaseId}" in card "${card.id}".`
              )
            }
            return []
          })
        }
      }

      cards.value = allCards
      productNames.value = [...productNamesSet]
      traits.value = [...traitsSet]
      costRange.value = {
        min: minCost === Infinity ? 0 : minCost,
        max: maxCost === -Infinity ? 0 : maxCost,
      }
      powerRange.value = {
        min: minPower === Infinity ? 0 : minPower,
        max: maxPower === -Infinity ? 0 : maxPower,
      }

      cache.set(cacheKey, {
        allCards,
        productNames: productNames.value,
        traits: traits.value,
        costRange: costRange.value,
        powerRange: powerRange.value,
      })
    } catch (e) {
      console.error('Failed to load series cards:', e)
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  watch(prefixesRef, fetchData, { immediate: true })

  return { cards, isLoading, error, productNames, traits, costRange, powerRange }
}
