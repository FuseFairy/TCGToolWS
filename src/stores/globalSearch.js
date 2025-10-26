import { defineStore } from 'pinia'
import { ref } from 'vue'
import { inflate } from 'pako'
import { useCardFiltering } from '@/composables/useCardFiltering.js'

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

  // Use the composable for filtering logic
  const { keyword, selectedCardTypes, selectedColors, selectedProductName, selectedTraits, selectedLevels, selectedRarities, showUniqueCards, selectedCostRange, selectedPowerRange, resetFilters, filteredCards } = useCardFiltering(allCards, productNames, traits, rarities, costRange, powerRange)

  // --- Search Results ---
  const searchResults = ref([])
  const hasActiveFilters = ref(false)

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
    hasActiveFilters.value = true
    if (!isReady.value || allCards.value.length === 0) return

    try {
      searchResults.value = filteredCards.value.slice(0, 1000)

      if (filteredCards.value.length > 1000) {
        console.warn(`搜尋結果過多 (${filteredCards.value.length})，只顯示前 1000 筆`)
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
    hasActiveFilters,
    // Actions
    initialize,
    search,
    resetFilters,
  }
})
