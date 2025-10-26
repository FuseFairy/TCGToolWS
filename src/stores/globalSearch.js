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
  const {
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
    resetFilters,
    filteredCards,
    applyFilters, // Extract applyFilters
    initializeWorker,
    terminateWorker,
  } = useCardFiltering(productNames, traits, rarities, costRange, powerRange)

  // --- Search Results ---
  const searchResults = ref([])
  const searchCountDetails = ref({
    isCountOverThreshold: false,
    actualResultCount: 0,
  })
  const hasActiveFilters = ref(false)

  // --- IndexedDB Helpers ---
  const dbName = 'CardDataDB'
  const storeName = 'cardStore'
  const dbKey = 'card-data'

  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)
      request.onerror = () => reject(new Error('❌ Failed to open IndexedDB'))
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'key' })
        }
      }
    })
  }

  const saveDataToDB = (db, data) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put({ key: dbKey, data })
      request.onerror = () => reject(new Error('❌ Failed to save data to IndexedDB'))
      request.onsuccess = () => resolve(request.result)
    })
  }

  const loadDataFromDB = (db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(dbKey)
      request.onerror = () => reject(new Error('❌ Failed to load data from IndexedDB'))
      request.onsuccess = () => resolve(request.result?.data)
    })
  }

  // --- Data Loading Logic ---

  const setCardData = async (data, source) => {
    allCards.value = data.cards
    productNames.value = data.filterOptions.productNames
    traits.value = data.filterOptions.traits
    rarities.value = data.filterOptions.rarities
    costRange.value = data.filterOptions.costRange
    powerRange.value = data.filterOptions.powerRange
    resetFilters()
    await initializeWorker(data.cards)
    console.log(`✅ Successfully loaded ${allCards.value.length} cards from ${source}`)
  }

  const fetchAndStoreData = async (fileName, version) => {
    isLoading.value = true
    error.value = null
    let db
    try {
      console.log(`📥 Fetching card database from remote: ${fileName}`)
      const response = await fetch(`/${fileName}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch card database: ${response.statusText}`)
      }

      const compressedBuffer = await response.arrayBuffer()
      const decompressed = inflate(new Uint8Array(compressedBuffer), { to: 'string' })
      const data = JSON.parse(decompressed)

      db = await openDB()
      await saveDataToDB(db, data)
      console.log('💾 Card data has been stored in the local database (IndexedDB)')

      await setCardData(data, 'remote server')

      localStorage.setItem('global_search_index_version', version)
      console.log(`📌 Version updated: ${version}`)
    } catch (e) {
      console.error('❌ Error loading or saving card data:', e)
      error.value = e
      throw e // Re-throw to be caught by initialize
    } finally {
      if (db) db.close()
      isLoading.value = false
    }
  }

  const loadDataFromLocal = async () => {
    isLoading.value = true
    let db
    try {
      db = await openDB()
      const cachedData = await loadDataFromDB(db)
      if (!cachedData) {
        console.warn('⚠️ Local cache is empty or invalid.')
        throw new Error('Local cache is empty.') // Trigger fallback
      }
      await setCardData(cachedData, 'local database (IndexedDB)')
    } catch (e) {
      console.error('❌ Failed to load from local database:', e)
      throw e // Re-throw to be caught by initialize for fallback
    } finally {
      if (db) db.close()
      isLoading.value = false
    }
  }

  const initialize = async () => {
    console.log('🔍 Checking card database version...')
    isLoading.value = true
    error.value = null

    try {
      const manifestResponse = await fetch('/card-db-manifest.json')
      if (!manifestResponse.ok) throw new Error('Failed to load manifest file')

      const manifest = await manifestResponse.json()
      const currentVersion = manifest.version
      const fileName = manifest.fileName
      console.log(`📌 Current version: ${currentVersion}`)

      const storedVersion = localStorage.getItem('global_search_index_version')
      console.log(`📌 Local version: ${storedVersion || 'None'}`)

      if (storedVersion === currentVersion) {
        console.log('✅ Versions match, trying to load from local database...')
        try {
          await loadDataFromLocal()
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          console.log('↪️ Local load failed, fetching from remote...')
          await fetchAndStoreData(fileName, currentVersion)
        }
      } else {
        console.log(
          `🔄 Version mismatch (Local: ${storedVersion || 'None'}, Remote: ${currentVersion}), fetching new data...`
        )
        await fetchAndStoreData(fileName, currentVersion)
      }

      isReady.value = true
      console.log('✨ Data is ready!')
    } catch (e) {
      console.error('❌ Initialization failed:', e)
      error.value = e
      isReady.value = false
    } finally {
      isLoading.value = false
    }
  }

  const search = async () => {
    hasActiveFilters.value = true
    if (!isReady.value || allCards.value.length === 0) return

    try {
      await applyFilters() // Call applyFilters to ensure filteredCards is up-to-date
      searchCountDetails.value.actualResultCount = filteredCards.value.length
      searchCountDetails.value.isCountOverThreshold = filteredCards.value.length > 1000
      searchResults.value = filteredCards.value.slice(0, 1000)
    } catch (e) {
      console.error('Search error:', e)
      error.value = e
    }
  }

  const terminate = () => {
    terminateWorker()
    allCards.value = []
    isReady.value = false
    searchResults.value = []
    hasActiveFilters.value = false
    resetFilters()
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
    searchCountDetails,
    hasActiveFilters,
    // Actions
    initialize,
    search,
    resetFilters,
    terminate,
  }
})
