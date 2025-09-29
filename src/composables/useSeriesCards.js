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

      // --- 第一遍處理 (First Pass): 解析新結構的資料 ---
      for (const file of allFileContents) {
        for (const baseId in file.content) {
          // 取得包含共同屬性的基礎卡片物件
          const cardData = file.content[baseId]

          // 提取篩選器所需資訊 (這部分邏輯不變)
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

          // =================== KEY CHANGE START ===================
          // 從 cardData 中解構出 all_cards 陣列和其餘的基礎屬性
          const { all_cards, ...baseCardData } = cardData

          // 遍歷 all_cards 陣列，將基礎屬性與每個版本特定屬性合併
          if (all_cards && Array.isArray(all_cards)) {
            all_cards.forEach((cardVersion) => {
              allCards.push({
                ...baseCardData, // 包含 name, effect, level, power, link 等
                ...cardVersion, // 包含 id, rarity
                baseId: baseId, // 將原始 key (baseId) 加入，供後續處理使用
                cardIdPrefix: file.cardIdPrefix,
              })
            })
          }
          // =================== KEY CHANGE END =====================
        }
      }

      // --- 第二遍處理 (Second Pass): 修正內部 link 引用 (此段邏輯無需修改) ---

      // 1. 建立一個 "一對多" 的 Map: <baseId, string[]>
      const baseIdToFullIdsMap = new Map()
      for (const card of allCards) {
        if (!baseIdToFullIdsMap.has(card.baseId)) {
          baseIdToFullIdsMap.set(card.baseId, [])
        }
        baseIdToFullIdsMap.get(card.baseId).push(card.id)
      }

      // 2. 使用 flatMap 遍歷並擴展 link 陣列
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
