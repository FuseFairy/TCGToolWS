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
        }),
      )

      const allCards = []
      const productNamesSet = new Set()
      const traitsSet = new Set()
      let minCost = Infinity
      let maxCost = -Infinity
      let minPower = Infinity
      let maxPower = -Infinity

      // --- 第一遍處理 (First Pass): 解析原始資料，生成唯一的 card id ---
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

          cardData.rarity.forEach((rarity) => {
            const suffix = rarity.includes('-') ? rarity.split('-')[1] : rarity
            const fullCardId = `${baseId}${suffix}`
            allCards.push({
              ...cardData,
              id: fullCardId,
              baseId: baseId,
              cardIdPrefix: file.cardIdPrefix,
            })
          })
        }
      }

      // --- 第二遍處理 (Second Pass): 修正內部 link 引用 ---

      // 1. 建立一個 "一對多" 的 Map: <baseId, string[]>
      const baseIdToFullIdsMap = new Map()
      for (const card of allCards) {
        if (!baseIdToFullIdsMap.has(card.baseId)) {
          // 如果 Map 中沒有這個 baseId，就用一個空陣列初始化它
          baseIdToFullIdsMap.set(card.baseId, [])
        }
        // 將當前的完整 id推進對應 baseId 的陣列中
        baseIdToFullIdsMap.get(card.baseId).push(card.id)
      }

      // 2. 使用 flatMap 遍歷並擴展 link 陣列
      for (const card of allCards) {
        if (card.link && Array.isArray(card.link) && card.link.length > 0) {
          card.link = card.link.flatMap((linkBaseId) => {
            const fullIds = baseIdToFullIdsMap.get(linkBaseId)
            if (fullIds && fullIds.length > 0) {
              return fullIds // flatMap 會自動將這個陣列攤平到結果中
            }
            if (import.meta.env.DEV) {
              console.warn(
                `Could not find any full IDs for linked baseId "${linkBaseId}" in card "${card.id}".`,
              )
            }
            return [] // 如果找不到，返回一個空陣列， effectively 移除這個無效的 link
          })
        }
      }

      // --- 更新狀態與快取 ---
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
