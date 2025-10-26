// filter.worker.js

import Fuse from 'fuse.js'
import { expose } from 'comlink'

const toLevel = (level) => (level === '-' ? 0 : +level)

let fuse = null
let allCards = []
const CARD_ID_REGEX = /^[A-Z]{2,3}\/[A-Z0-9-]{1,}/i

const CardFilterService = {
  /**
   * 初始化服務，接收全部卡片資料並建立 Fuse 索引
   * @param {Array} cards - 所有的卡片資料
   */
  init: (cards) => {
    allCards = cards
    const options = {
      threshold: 0.3,
      keys: [
        { name: 'name', weight: 2 },
        { name: 'effect', weight: 2 },
        { name: 'is', weight: 1 },
      ],
      ignoreLocation: true,
      ignoreDiacritics: true,
      minMatchCharLength: 2,
      fieldNormWeight: 0.5,
    }
    fuse = new Fuse(allCards, options)
    console.log(`Fuse.js index created for ${allCards.length} cards.`)
  },

  /**
   * 根據傳入的篩選條件執行篩選
   * @param {object} filters - 包含所有篩選條件的物件
   * @returns {Array} - 篩選後的卡片陣列
   */
  filter: (filters) => {
    if (!allCards || allCards.length === 0) {
      return []
    }

    const keyword = filters.keyword
    let results = allCards

    // 判斷是否為卡號搜尋
    if (keyword && CARD_ID_REGEX.test(keyword)) {
      console.log('Card ID pattern detected. Bypassing Fuse.js for exact match...')
      console.time('Exact ID search time')

      results = allCards.filter((card) => card.id.toLowerCase() === keyword.toLowerCase())

      console.timeEnd('Exact ID search time')
      console.log(`Found ${results.length} exact matches.`)
    } else {
      // 使用 Fuse.js 進行高效能的關鍵字搜索
      if (filters.keyword && filters.keyword.length >= 2 && fuse) {
        console.log(`Searching for "${filters.keyword}" in ${results.length} items...`)

        console.time('Fuse.js search time')
        const searchResults = fuse.search(filters.keyword)
        console.timeEnd('Fuse.js search time')

        console.log(`Fuse.js found ${searchResults.length} potential matches.`)

        results = searchResults.map((result) => result.item)
      } else if (filters.keyword) {
        return []
      }
    }

    const mappedLevels =
      filters.selectedLevels.length > 0 ? new Set(filters.selectedLevels.map(toLevel)) : null

    if (filters.showUniqueCards) {
      const seenBaseIds = new Set()
      const uniqueResults = []
      for (const card of results) {
        if (!seenBaseIds.has(card.baseId)) {
          seenBaseIds.add(card.baseId)
          uniqueResults.push(card)
        }
      }
      results = uniqueResults
    }

    return results.filter((card) => {
      if (filters.selectedCardTypes.length > 0 && !filters.selectedCardTypes.includes(card.type))
        return false
      if (filters.selectedColors.length > 0 && !filters.selectedColors.includes(card.color))
        return false
      if (filters.selectedProductName && card.product_name !== filters.selectedProductName)
        return false
      if (
        filters.selectedTraits.length > 0 &&
        !filters.selectedTraits.every((trait) => card.trait && card.trait.includes(trait))
      )
        return false
      if (mappedLevels && !mappedLevels.has(toLevel(card.level))) return false
      if (filters.selectedRarities.length > 0 && !filters.selectedRarities.includes(card.rarity))
        return false
      if (card.cost < filters.selectedCostRange[0] || card.cost > filters.selectedCostRange[1])
        return false
      if (card.power < filters.selectedPowerRange[0] || card.power > filters.selectedPowerRange[1])
        return false
      return true
    })
  },
}

expose(CardFilterService)
