// filter.worker.js

import Fuse from 'fuse.js'
import { expose } from 'comlink'

const toLevel = (level) => (level === '-' ? 0 : +level)

let fuse = null
let allCards = []

let keywordResultsCache = null

const CardFilterService = {
  /**
   * 初始化服務，接收全部卡片資料並建立 Fuse 索引
   * @param {Array} cards - 所有的卡片資料
   */
  init: (cards) => {
    allCards = cards
    keywordResultsCache = null // Reset cache on new data
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
   * 根據關鍵字搜尋卡片，並將結果暫存起來
   * @param {string} keyword - 用於搜尋的關鍵字
   */
  searchByKeyword: (keyword) => {
    if (!keyword) {
      keywordResultsCache = allCards
      return
    }

    if (keyword.length >= 2 && fuse) {
      console.log(`Searching for "${keyword}" in ${allCards.length} items...`)

      console.time('Fuse.js search time')
      const searchResults = fuse.search(keyword)
      console.timeEnd('Fuse.js search time')

      console.log(`Fuse.js found ${searchResults.length} potential matches.`)
      keywordResultsCache = searchResults.map((result) => result.item)
    } else {
      keywordResultsCache = []
    }
  },

  /**
   * 根據屬性篩選已透過關鍵字搜尋的結果
   * @param {object} filters - 篩選條件物件
   * @returns {Array} 篩選後的卡片陣列
   */
  filterByAttributes: (filters) => {
    let results = keywordResultsCache
    if (!results) results = allCards // Keyword search results cache is empty. Filtering all cards.

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
