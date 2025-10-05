import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { findSeriesDataFileName } from '@/maps/series-card-map.js'
import { getAssetsFile } from '@/utils/getAssetsFile.js'

const cache = new Map()

export const useFilterStore = defineStore('filter', () => {
  // --- State ---

  // Raw data from API
  const allCards = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Filter options derived from raw data
  const productNames = ref([])
  const traits = ref([])
  const costRange = ref({ min: 0, max: 0 })
  const powerRange = ref({ min: 0, max: 0 })

  // User-selected filter values
  const keyword = ref('')
  const selectedCardTypes = ref([])
  const selectedColors = ref([])
  const selectedProductName = ref(null)
  const selectedTraits = ref([])
  const selectedLevels = ref([])
  const selectedCostRange = ref([0, 0])
  const selectedPowerRange = ref([0, 0])

  // --- Actions ---

  const initialize = async (prefixes) => {
    if (!prefixes || prefixes.length === 0) {
      reset()
      return
    }

    const cacheKey = prefixes.join(',')
    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey)
      allCards.value = cachedData.allCards
      productNames.value = cachedData.productNames
      traits.value = cachedData.traits
      costRange.value = cachedData.costRange
      powerRange.value = cachedData.powerRange
      resetFilters()
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

      const fetchedCards = []
      const productNamesSet = new Set()
      const traitsSet = new Set()
      let minCost = Infinity,
        maxCost = -Infinity,
        minPower = Infinity,
        maxPower = -Infinity

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
              fetchedCards.push({
                ...baseCardData,
                ...cardVersion,
                baseId,
                cardIdPrefix: file.cardIdPrefix,
              })
            })
          }
        }
      }

      // Link cards
      const baseIdToFullIdsMap = new Map()
      for (const card of fetchedCards) {
        if (!baseIdToFullIdsMap.has(card.baseId)) {
          baseIdToFullIdsMap.set(card.baseId, [])
        }
        baseIdToFullIdsMap.get(card.baseId).push(card.id)
      }
      for (const card of fetchedCards) {
        if (card.link && Array.isArray(card.link) && card.link.length > 0) {
          card.link = card.link.flatMap((linkBaseId) => baseIdToFullIdsMap.get(linkBaseId) || [])
        }
      }

      allCards.value = fetchedCards
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
        allCards: allCards.value,
        productNames: productNames.value,
        traits: traits.value,
        costRange: costRange.value,
        powerRange: powerRange.value,
      })

      resetFilters()
    } catch (e) {
      console.error('Failed to load series cards in filter store:', e)
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  const resetFilters = () => {
    keyword.value = ''
    selectedCardTypes.value = []
    selectedColors.value = []
    selectedProductName.value = null
    selectedTraits.value = []
    selectedLevels.value = []
    selectedCostRange.value = [costRange.value.min, costRange.value.max]
    selectedPowerRange.value = [powerRange.value.min, powerRange.value.max]
  }

  const reset = () => {
    allCards.value = []
    productNames.value = []
    traits.value = []
    costRange.value = { min: 0, max: 0 }
    powerRange.value = { min: 0, max: 0 }
    resetFilters()
  }

  // --- Getters ---

  const filteredCards = computed(() => {
    let filtered = allCards.value

    if (keyword.value) {
      const lowerCaseKeyword = keyword.value.toLowerCase()
      filtered = filtered.filter(
        (card) =>
          card.baseId.toLowerCase().includes(lowerCaseKeyword) ||
          card.id.toLowerCase().includes(lowerCaseKeyword) ||
          (card.effect && card.effect.toLowerCase().includes(lowerCaseKeyword)) ||
          card.name.toLowerCase().includes(lowerCaseKeyword)
      )
    }

    if (selectedCardTypes.value.length > 0) {
      filtered = filtered.filter((card) => selectedCardTypes.value.includes(card.type))
    }

    if (selectedColors.value.length > 0) {
      filtered = filtered.filter((card) => selectedColors.value.includes(card.color))
    }

    if (selectedProductName.value) {
      filtered = filtered.filter((card) => card.product_name === selectedProductName.value)
    }

    if (selectedTraits.value.length > 0) {
      filtered = filtered.filter((card) =>
        selectedTraits.value.every((trait) => card.trait && card.trait.includes(trait))
      )
    }

    const toLevel = (level) => (level === '-' ? 0 : +level)
    if (selectedLevels.value.length > 0) {
      const mappedLevels = new Set(selectedLevels.value.map(toLevel))
      filtered = filtered.filter((card) => mappedLevels.has(toLevel(card.level)))
    }

    if (
      selectedCostRange.value &&
      (selectedCostRange.value[0] !== costRange.value.min ||
        selectedCostRange.value[1] !== costRange.value.max)
    ) {
      filtered = filtered.filter(
        (card) => card.cost >= selectedCostRange.value[0] && card.cost <= selectedCostRange.value[1]
      )
    }

    if (
      selectedPowerRange.value &&
      (selectedPowerRange.value[0] !== powerRange.value.min ||
        selectedPowerRange.value[1] !== powerRange.value.max)
    ) {
      filtered = filtered.filter(
        (card) =>
          card.power >= selectedPowerRange.value[0] && card.power <= selectedPowerRange.value[1]
      )
    }

    return filtered
  })

  return {
    // State
    allCards,
    isLoading,
    error,
    productNames,
    traits,
    costRange,
    powerRange,
    keyword,
    selectedCardTypes,
    selectedColors,
    selectedProductName,
    selectedTraits,
    selectedLevels,
    selectedCostRange,
    selectedPowerRange,
    // Getters
    filteredCards,
    // Actions
    initialize,
    resetFilters,
    reset,
  }
})
