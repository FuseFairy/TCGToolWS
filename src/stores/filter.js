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
  const rarities = ref([])
  const costRange = ref({ min: 0, max: 0 })
  const powerRange = ref({ min: 0, max: 0 })

  // User-selected filter values
  const keyword = ref('')
  const selectedCardTypes = ref([])
  const selectedColors = ref([])
  const selectedProductName = ref(null)
  const selectedTraits = ref([])
  const selectedLevels = ref([])
  const selectedRarities = ref([])
  const showUniqueCards = ref(false)
  const selectedCostRange = ref([0, 0])
  const selectedPowerRange = ref([0, 0])

  // --- Actions ---

  const fetchAndProcessCards = async (prefixes) => {
    if (!prefixes || prefixes.length === 0) {
      return {
        allCards: [],
        productNames: [],
        traits: [],
        costRange: { min: 0, max: 0 },
        powerRange: { min: 0, max: 0 },
      }
    }

    const cacheKey = prefixes.join(',')
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

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
      const raritiesSet = new Set()
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
              if (cardVersion.rarity) raritiesSet.add(cardVersion.rarity)
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

      fetchedCards.forEach((card) => (card.link = []))

      const nameToCardBaseIds = new Map()
      const baseIdToCardsMap = new Map()

      for (const card of fetchedCards) {
        if (!nameToCardBaseIds.has(card.name)) {
          nameToCardBaseIds.set(card.name, new Set())
        }
        nameToCardBaseIds.get(card.name).add(card.baseId)

        if (!baseIdToCardsMap.has(card.baseId)) {
          baseIdToCardsMap.set(card.baseId, [])
        }
        baseIdToCardsMap.get(card.baseId).push(card)
      }

      const escapeRegex = (str) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }

      const allNamesPattern = [...nameToCardBaseIds.keys()].map(escapeRegex).join('|')

      const nameMatcherRegex = new RegExp(`「(${allNamesPattern})」`, 'g')

      for (const targetCard of fetchedCards) {
        const effectText = targetCard.effect || ''
        if (!effectText) continue

        const matches = effectText.matchAll(nameMatcherRegex)

        for (const match of matches) {
          const foundName = match[1]
          const sourceBaseIds = nameToCardBaseIds.get(foundName)

          if (sourceBaseIds) {
            for (const sourceBaseId of sourceBaseIds) {
              if (!targetCard.link.includes(sourceBaseId)) {
                targetCard.link.push(sourceBaseId)
              }
              const sourceCardsToUpdate = baseIdToCardsMap.get(sourceBaseId)
              if (sourceCardsToUpdate) {
                for (const sourceCard of sourceCardsToUpdate) {
                  if (!sourceCard.link.includes(targetCard.baseId)) {
                    sourceCard.link.push(targetCard.baseId)
                  }
                }
              }
            }
          }
        }
      }

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

      const result = {
        allCards: fetchedCards,
        productNames: [...productNamesSet],
        traits: [...traitsSet],
        rarities: [...raritiesSet].sort(),
        costRange: {
          min: minCost === Infinity ? 0 : minCost,
          max: maxCost === -Infinity ? 0 : maxCost,
        },
        powerRange: {
          min: minPower === Infinity ? 0 : minPower,
          max: maxPower === -Infinity ? 0 : maxPower,
        },
      }

      cache.set(cacheKey, result)
      return result
    } catch (e) {
      console.error('Failed to load series cards in filter store:', e)
      error.value = e
      return {
        allCards: [],
        productNames: [],
        traits: [],
        costRange: { min: 0, max: 0 },
        powerRange: { min: 0, max: 0 },
      }
    }
  }

  const initialize = async (prefixes) => {
    isLoading.value = true
    error.value = null
    try {
      const {
        allCards: fetchedCards,
        productNames: fetchedProductNames,
        traits: fetchedTraits,
        rarities: fetchedRarities,
        costRange: fetchedCostRange,
        powerRange: fetchedPowerRange,
      } = await fetchAndProcessCards(prefixes)

      allCards.value = fetchedCards
      productNames.value = fetchedProductNames
      traits.value = fetchedTraits
      rarities.value = fetchedRarities
      costRange.value = fetchedCostRange
      powerRange.value = fetchedPowerRange
      resetFilters()
    } catch (e) {
      console.error('Failed to initialize filter store:', e)
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
    selectedRarities.value = []
    showUniqueCards.value = false
    selectedCostRange.value = [costRange.value.min, costRange.value.max]
    selectedPowerRange.value = [powerRange.value.min, powerRange.value.max]
  }

  const reset = () => {
    allCards.value = []
    productNames.value = []
    traits.value = []
    rarities.value = []
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

    if (selectedRarities.value.length > 0) {
      filtered = filtered.filter((card) => selectedRarities.value.includes(card.rarity))
    }

    if (showUniqueCards.value) {
      const seenBaseIds = new Set()
      filtered = filtered.filter((card) => {
        if (seenBaseIds.has(card.baseId)) {
          return false
        }
        seenBaseIds.add(card.baseId)
        return true
      })
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
    rarities,
    costRange,
    powerRange,
    keyword,
    selectedCardTypes,
    selectedColors,
    selectedProductName,
    selectedTraits,
    selectedLevels,
    selectedRarities,
    showUniqueCards,
    selectedCostRange,
    selectedPowerRange,
    // Getters
    filteredCards,
    // Actions
    initialize,
    fetchAndProcessCards,
    resetFilters,
    reset,
  }
})
