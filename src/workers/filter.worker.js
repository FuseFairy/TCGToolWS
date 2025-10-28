import { Document, Charset } from 'flexsearch'
import { expose } from 'comlink'

const toLevel = (level) => (level === '-' ? 0 : +level)

let allCards = []
let keywordResultsCache = null
let searchIndex = null

const CardFilterService = {
  /**
   * 初始化服務，接收全部卡片資料
   * @param {Array} cards - 所有的卡片資料
   */
  init: (cards) => {
    allCards = cards
    keywordResultsCache = null

    // 建立 FlexSearch Document 索引
    searchIndex = new Document({
      tokenize: 'forward',
      encoder: Charset.CJK,
      document: {
        id: 'index',
        index: ['name', 'effect', 'id'],
      },
    })

    // 將所有卡片加入索引
    allCards.forEach((card, idx) => {
      searchIndex.add({
        index: idx, // 使用陣列索引作為 ID
        name: card.name || '',
        effect: card.effect || '',
        id: card.id || '',
      })
    })

    console.log(`FlexSearch is ready for ${allCards.length} cards.`)
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
      console.log(`Searching for "${keyword}" with FlexSearch in ${allCards.length} items...`)
      console.time('search time')

      // FlexSearch 搜索
      const searchResults = searchIndex.search(keyword, { limit: Infinity })

      // 收集所有匹配索引
      const matchedIndices = new Set()
      searchResults.forEach((fieldResult) => {
        if (fieldResult && fieldResult.result) {
          fieldResult.result.forEach((idx) => matchedIndices.add(idx))
        }
      })

      // 取出卡片物件
      let results = Array.from(matchedIndices).map((idx) => allCards[idx])

      // 用 includes 過濾
      const lowerKeyword = keyword.toLowerCase()

      results = results.filter(
        (card) =>
          (card.name && card.name.toLowerCase().includes(lowerKeyword)) ||
          (card.id && card.id.toLowerCase().includes(lowerKeyword)) ||
          (card.effect && card.effect.toLowerCase().includes(lowerKeyword))
      )

      // 精確匹配排前面
      results.sort((a, b) => {
        const aExact = a.name === keyword || a.id === keyword || a.effect === keyword
        const bExact = b.name === keyword || b.id === keyword || b.effect === keyword
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return 0
      })

      console.timeEnd('search time')
      console.log(`Search found ${matchedIndices.size} potential matches.`)

      keywordResultsCache = results
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
