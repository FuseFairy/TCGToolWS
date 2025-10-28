import fuzzysort from 'fuzzysort'
import { expose } from 'comlink'

const toLevel = (level) => (level === '-' ? 0 : +level)

let allCards = []
let keywordResultsCache = null

const CardFilterService = {
  /**
   * 初始化服務，接收全部卡片資料
   * @param {Array} cards - 所有的卡片資料
   */
  init: (cards) => {
    allCards = cards
    keywordResultsCache = null
    console.log(`fuzzysort is ready for ${allCards.length} cards.`)
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

    if (keyword.length >= 2) {
      console.log(`Searching for "${keyword}" with fuzzysort in ${allCards.length} items...`)

      // fuzzysort 的選項
      const options = {
        keys: ['name', 'effect', 'id'],
        threshold: 0.2,
      }

      console.time('fuzzysort search time')
      const searchResults = fuzzysort.go(keyword, allCards, options)
      console.timeEnd('fuzzysort search time')

      console.log(`fuzzysort found ${searchResults.length} potential matches.`)
      keywordResultsCache = searchResults.map((result) => result.obj)
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
