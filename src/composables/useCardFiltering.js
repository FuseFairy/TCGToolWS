import { ref, computed, watch, shallowRef, toRaw } from 'vue'
import * as Comlink from 'comlink'
import FilterWorker from '@/workers/filter.worker.js?worker'

export const useCardFiltering = (
  allCardsRef,
  productNamesRef,
  traitsRef,
  raritiesRef,
  costRangeRef,
  powerRangeRef
) => {
  // User-selected filter values
  const keyword = ref('')
  const selectedCardTypes = ref([])
  const selectedColors = ref([])
  const selectedProductName = ref('')
  const selectedTraits = ref([])
  const selectedLevels = ref([])
  const selectedRarities = ref([])
  const showUniqueCards = ref(false)
  const selectedCostRange = ref([0, 0])
  const selectedPowerRange = ref([0, 0])

  const workerResults = shallowRef([])
  const filteredCards = computed(() => workerResults.value)
  let workerInstance = null
  let workerApiInstance = null

  const applyFilters = async () => {
    if (!workerApiInstance) {
      console.warn('Worker API not initialized, cannot apply filters.')
      workerResults.value = []
      return
    }
    const plainFilters = {
      keyword: toRaw(keyword.value),
      selectedCardTypes: toRaw(selectedCardTypes.value),
      selectedColors: toRaw(selectedColors.value),
      selectedProductName: toRaw(selectedProductName.value),
      selectedTraits: toRaw(selectedTraits.value),
      selectedLevels: toRaw(selectedLevels.value),
      selectedRarities: toRaw(selectedRarities.value),
      showUniqueCards: toRaw(showUniqueCards.value),
      selectedCostRange: toRaw(selectedCostRange.value),
      selectedPowerRange: toRaw(selectedPowerRange.value),
    }
    const results = await workerApiInstance.filter(plainFilters)
    workerResults.value = results
  }

  const terminateWorker = () => {
    if (workerInstance) {
      console.log('正在終止 Worker。')
      workerInstance.terminate()
      workerInstance = null
      workerApiInstance = null
    }
  }

  watch(
    allCardsRef,
    async (newCards) => {
      workerResults.value = [] // Explicitly clear results at the start of re-initialization

      // Terminate existing worker if any
      if (workerInstance) {
        console.log('正在終止舊 Worker (因 allCardsRef 變更)。')
        workerInstance.terminate()
        workerInstance = null
        workerApiInstance = null
      }

      if (newCards && newCards.length > 0) {
        console.log('正在建立並初始化新的 Worker...')
        workerInstance = new FilterWorker()
        workerApiInstance = Comlink.wrap(workerInstance)
        await workerApiInstance.init(toRaw(newCards))
        await applyFilters() // Apply filters immediately after worker is initialized
      } else {
        // If no cards, ensure worker is terminated and results are empty
        terminateWorker()
        workerResults.value = []
      }
    },
    { immediate: true }
  )

  watch(
    [
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
    ],
    async () => {
      // Only re-filter if allCardsRef has been processed and worker is initialized
      if (allCardsRef.value && allCardsRef.value.length > 0 && workerApiInstance) {
        await applyFilters()
      }
    },
    { deep: true }
  )
  const resetFilters = () => {
    keyword.value = ''
    selectedCardTypes.value = []
    selectedColors.value = []
    selectedProductName.value = ''
    selectedTraits.value = []
    selectedLevels.value = []
    selectedRarities.value = []
    showUniqueCards.value = false
    selectedCostRange.value = [costRangeRef.value.min, costRangeRef.value.max]
    selectedPowerRange.value = [powerRangeRef.value.min, powerRangeRef.value.max]
  }

  return {
    // State
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
    // Getters
    filteredCards,
    // Actions
    resetFilters,
    terminateWorker,
    applyFilters, // Expose applyFilters
  }
}
