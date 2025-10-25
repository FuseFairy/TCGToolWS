import Fuse from 'fuse.js'
import { expose } from 'comlink'

const toLevel = (level) => (level === '-' ? 0 : +level)

const CardFilterService = {
  fuse: null,
  allCards: [],

  /**
   * 初始化服務，接收全部卡片資料並建立 Fuse 索引
   * @param {Array} cards - 所有的卡片資料
   */
  init(cards) {
    this.allCards = cards
    const options = {
      keys: ['baseId', 'id', 'effect', 'name'],
      threshold: 0.4,
      minMatchCharLength: 2,
    }
    this.fuse = new Fuse(this.allCards, options)
  },

  /**
   * 根據傳入的篩選條件執行篩選
   * @param {object} filters - 包含所有篩選條件的物件
   * @returns {Array} - 篩選後的卡片陣列
   */
  filter(filters) {
    if (!this.allCards || this.allCards.length === 0) {
      return []
    }

    let results = this.allCards

    // 使用 Fuse.js 進行高效能的關鍵字搜索
    if (filters.keyword && filters.keyword.length >= 2 && this.fuse) {
      results = this.fuse.search(filters.keyword).map((result) => result.item)
    } else if (filters.keyword) {
      return []
    }

    // 在縮小範圍後的結果上，執行合併迴圈的精確篩選
    const mappedLevels =
      filters.selectedLevels.length > 0 ? new Set(filters.selectedLevels.map(toLevel)) : null

    let filtered = results.filter((card) => {
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

    // 處理唯一卡片邏輯
    if (filters.showUniqueCards) {
      const seenBaseIds = new Set()
      return filtered.filter((card) => {
        if (seenBaseIds.has(card.baseId)) {
          return false
        }
        seenBaseIds.add(card.baseId)
        return true
      })
    }

    return filtered
  },
}

expose(CardFilterService)
