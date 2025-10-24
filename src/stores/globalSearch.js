import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
import * as FlexSearch from 'flexsearch'
import { assetModules, getAssetsFile } from '@/utils/getAssetsFile.js'

export const useGlobalSearchStore = defineStore('globalSearch', () => {
  // --- Index State ---
  const index = ref(null) // FlexSearch instance
  const isReady = ref(false) // Is the index loaded/built
  const isLoading = ref(false) // Is the index currently being built (for the first time)
  const error = ref(null)

  // --- Filter Options (from index) ---
  const productNames = ref([])
  const traits = ref([])
  const rarities = ref([])
  const costRange = ref({ min: 0, max: 0 })
  const powerRange = ref({ min: 0, max: 0 })

  // --- User-selected filter values ---
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

  // --- Search Results ---
  const searchResults = ref([])

  // --- Actions ---
  function resetFilters() {
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

  async function initialize() {
    const CURRENT_VERSION = 'v1.0.0'
    const storedVersion = localStorage.getItem('global_search_index_version')
    const storedFilterOptions = localStorage.getItem('global_search_filter_options')

    if (storedVersion !== CURRENT_VERSION || !storedFilterOptions) {
      console.log('Global search index not found or outdated. Building...')
      await buildIndex()
      resetFilters()
    } else {
      console.log('Loading global search index from IndexedDB...')
      isLoading.value = true
      const options = JSON.parse(storedFilterOptions)

      productNames.value = options.productNames
      traits.value = options.traits
      rarities.value = options.rarities
      costRange.value = options.costRange
      powerRange.value = options.powerRange
      resetFilters()

      const db = new FlexSearch.IndexedDB('GlobalCardIndex')
      index.value = new FlexSearch.Document({
        name: 'GlobalCardIndex',
        charset: 'utf-8',
        tokenize: 'forward',
        store: true,
        document: {
          id: 'id',
          index: ['name', 'effect', 'id', 'baseId'],
          tag: ['type', 'color', 'product_name', 'trait', 'level', 'rarity', 'cost', 'power'],
        },
      })
      await index.value.mount(db)
      await index.value.info()
      isLoading.value = false
      console.log('Global search index loaded.')
    }
    isReady.value = true
  }

  async function search() {
    if (!isReady.value || !index.value) return

    const { deburr } = await import('lodash-es')
    const query = deburr(keyword.value.toLowerCase())

    const tagQuery = []
    if (selectedCardTypes.value.length > 0)
      tagQuery.push({ field: 'type', query: selectedCardTypes.value })
    if (selectedColors.value.length > 0)
      tagQuery.push({ field: 'color', query: selectedColors.value })
    if (selectedProductName.value)
      tagQuery.push({ field: 'product_name', query: selectedProductName.value })
    if (selectedTraits.value.length > 0)
      tagQuery.push({ field: 'trait', query: selectedTraits.value, bool: 'and' })
    if (selectedLevels.value.length > 0)
      tagQuery.push({ field: 'level', query: selectedLevels.value })
    if (selectedRarities.value.length > 0)
      tagQuery.push({ field: 'rarity', query: selectedRarities.value })

    const results = await index.value.searchAsync({
      query,
      index: ['name', 'effect', 'id', 'baseId'],
      tag: tagQuery,
      store: true,
      limit: 5000,
    })

    const uniqueIds = new Set()
    let flatResults = []
    for (const fieldResult of results) {
      for (const doc of fieldResult.result) {
        if (!uniqueIds.has(doc.id)) {
          uniqueIds.add(doc.id)
          flatResults.push(doc.doc)
        }
      }
    }

    const [minCost, maxCost] = selectedCostRange.value
    const [minPower, maxPower] = selectedPowerRange.value

    if (minCost !== costRange.value.min || maxCost !== costRange.value.max) {
      flatResults = flatResults.filter((c) => c.cost >= minCost && c.cost <= maxCost)
    }
    if (minPower !== powerRange.value.min || maxPower !== powerRange.value.max) {
      flatResults = flatResults.filter((c) => c.power >= minPower && c.power <= maxPower)
    }

    if (showUniqueCards.value) {
      const seenBaseIds = new Set()
      flatResults = flatResults.filter((card) => {
        if (seenBaseIds.has(card.baseId)) return false
        seenBaseIds.add(card.baseId)
        return true
      })
    }

    searchResults.value = flatResults
  }

  async function buildIndex() {
    isLoading.value = true
    error.value = null

    try {
      const db = new FlexSearch.IndexedDB('GlobalCardIndex')
      index.value = new FlexSearch.Document({
        name: 'GlobalCardIndex',
        charset: 'utf-8',
        tokenize: 'forward',
        store: true,
        document: {
          id: 'id',
          index: ['name', 'effect', 'id', 'baseId'],
          tag: ['type', 'color', 'product_name', 'trait', 'level', 'rarity', 'cost', 'power'],
        },
      })
      await index.value.mount(db)
      index.value.clear()

      const allSeriesCardPaths = Object.keys(assetModules)
        .filter((fullPath) => fullPath.startsWith('/src/assets/card-data/'))
        .map((fullPath) => fullPath.substring('/src/assets/'.length))

      const allFileContents = await Promise.all(
        allSeriesCardPaths.map(async (path) => {
          const url = await getAssetsFile(path)
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
        await index.value.addAsync(toRaw(card))
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

      for (const card of fetchedCards) {
        await index.value.addAsync(card)
      }

      const finalCostRange = {
        min: minCost === Infinity ? 0 : minCost,
        max: maxCost === -Infinity ? 0 : maxCost,
      }
      const finalPowerRange = {
        min: minPower === Infinity ? 0 : minPower,
        max: maxPower === -Infinity ? 0 : maxPower,
      }

      productNames.value = [...productNamesSet]
      traits.value = [...traitsSet]
      rarities.value = [...raritiesSet].sort()
      costRange.value = finalCostRange
      powerRange.value = finalPowerRange

      const filterOptions = {
        productNames: productNames.value,
        traits: traits.value,
        rarities: rarities.value,
        costRange: finalCostRange,
        powerRange: finalPowerRange,
      }
      localStorage.setItem('global_search_filter_options', JSON.stringify(filterOptions))
      localStorage.setItem('global_search_index_version', 'v1.0.0')
    } catch (e) {
      console.error('Error building global search index:', e)
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  async function search() { /* ... */ }
  function resetFilters() { /* ... */ }

  return {
    // State
    index,
    isReady,
    isLoading,
    error,
    // Filter Options
    productNames,
    traits,
    rarities,
    costRange,
    powerRange,
    // Selected Filters
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
    // Results
    searchResults,
    // Actions
    initialize,
    buildIndex,
    search,
    resetFilters,
  }
})
