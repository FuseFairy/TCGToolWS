import { defineStore } from 'pinia'
import { ref } from 'vue'
import { inflate } from 'pako'

export const useGlobalSearchStore = defineStore('globalSearch', () => {
  // --- State ---
  const allCards = ref([]) // 所有卡片資料
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  // --- Filter Options ---
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
    console.log('🔍 檢查卡片資料庫版本...')

    try {
      // 載入 manifest 檔案以取得當前版本
      const manifestResponse = await fetch('/card-db-manifest.json')
      if (!manifestResponse.ok) {
        throw new Error('無法載入 manifest 檔案')
      }

      const manifest = await manifestResponse.json()
      const currentVersion = manifest.version
      const fileName = manifest.fileName

      console.log(`📌 當前版本: ${currentVersion}`)

      // 檢查本地儲存的版本
      const storedVersion = localStorage.getItem('global_search_index_version')

      if (storedVersion !== currentVersion) {
        console.log(
          `🔄 版本不同 (本地: ${storedVersion || '無'}, 遠端: ${currentVersion})，重新載入資料...`
        )
        await loadData(fileName, currentVersion)
      } else {
        console.log('✅ 版本相同，載入資料...')
        await loadData(fileName, currentVersion)
      }

      isReady.value = true
    } catch (e) {
      console.error('❌ 初始化失敗:', e)
      error.value = e
      // 嘗試使用預設檔名作為後備方案
      try {
        await loadData('all_cards_db.json.bin', null)
        isReady.value = true
      } catch (fallbackError) {
        console.error('❌ 後備載入失敗:', fallbackError)
      }
    }
  }

  async function loadData(fileName, version) {
    isLoading.value = true
    error.value = null

    try {
      console.log(`📥 載入卡片資料庫: ${fileName}`)

      const response = await fetch(`/${fileName}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch card database: ${response.statusText}`)
      }

      const compressedBuffer = await response.arrayBuffer()
      const decompressed = inflate(new Uint8Array(compressedBuffer), { to: 'string' })
      const data = JSON.parse(decompressed)
      allCards.value = data.cards

      console.log(`✅ 載入 ${allCards.value.length} 張卡片`)

      // 設定篩選選項
      productNames.value = data.filterOptions.productNames
      traits.value = data.filterOptions.traits
      rarities.value = data.filterOptions.rarities
      costRange.value = data.filterOptions.costRange
      powerRange.value = data.filterOptions.powerRange
      resetFilters()

      // 更新本地儲存的版本號
      if (version) {
        localStorage.setItem('global_search_index_version', version)
        console.log(`💾 版本已更新: ${version}`)
      } else if (data.version) {
        localStorage.setItem('global_search_index_version', data.version)
        console.log(`💾 版本已更新: ${data.version}`)
      }

      console.log('✨ 資料載入完成！')
    } catch (e) {
      console.error('Error loading card data:', e)
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  async function search() {
    if (!isReady.value || allCards.value.length === 0) return

    try {
      // 準備搜尋關鍵字
      const query = keyword.value ? deburr(keyword.value.toLowerCase()) : ''

      // 篩選卡片
      let results = allCards.value

      // 關鍵字搜尋
      if (query) {
        results = results.filter((card) => {
          const searchableText = deburr(
            `${card.name} ${card.effect || ''} ${card.id} ${card.baseId}`.toLowerCase()
          )
          return searchableText.includes(query)
        })
      }

      // 類型篩選
      if (selectedCardTypes.value.length > 0) {
        results = results.filter((c) => selectedCardTypes.value.includes(c.type))
      }

      // 顏色篩選
      if (selectedColors.value.length > 0) {
        results = results.filter((c) => selectedColors.value.includes(c.color))
      }

      // 產品篩選
      if (selectedProductName.value) {
        results = results.filter((c) => c.product_name === selectedProductName.value)
      }

      // 特性篩選（AND 邏輯）
      if (selectedTraits.value.length > 0) {
        results = results.filter((c) => {
          if (!Array.isArray(c.trait)) return false
          return selectedTraits.value.every((t) => c.trait.includes(t))
        })
      }

      // 等級篩選
      if (selectedLevels.value.length > 0) {
        const toLevel = (level) => (level === '-' ? 0 : +level)
        const mappedLevels = new Set(selectedLevels.value.map(toLevel))
        results = results.filter((card) => mappedLevels.has(toLevel(card.level)))
      }

      // 稀有度篩選
      if (selectedRarities.value.length > 0) {
        results = results.filter((c) => selectedRarities.value.includes(c.rarity))
      }

      // 費用範圍篩選
      const [minCost, maxCost] = selectedCostRange.value
      if (minCost !== costRange.value.min || maxCost !== costRange.value.max) {
        results = results.filter((c) => c.cost >= minCost && c.cost <= maxCost)
      }

      // 戰力範圍篩選
      const [minPower, maxPower] = selectedPowerRange.value
      if (minPower !== powerRange.value.min || maxPower !== powerRange.value.max) {
        results = results.filter((c) => c.power >= minPower && c.power <= maxPower)
      }

      // 唯一卡片篩選
      if (showUniqueCards.value) {
        const seenBaseIds = new Set()
        results = results.filter((card) => {
          if (seenBaseIds.has(card.baseId)) return false
          seenBaseIds.add(card.baseId)
          return true
        })
      }

      // 限制結果數量以提升效能
      searchResults.value = results.slice(0, 1000)

      if (results.length > 1000) {
        console.warn(`搜尋結果過多 (${results.length})，只顯示前 1000 筆`)
      }
    } catch (e) {
      console.error('Search error:', e)
      error.value = e
    }
  }

  return {
    // State
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
    search,
    resetFilters,
  }
})
