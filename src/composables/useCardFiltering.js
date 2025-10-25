// useCardFiltering.js
import { ref, computed, watch, onUnmounted, shallowRef, toRaw } from 'vue' // 1. 導入 toRaw
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
  // --- 所有 ref 的定義保持不變 ---
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

  const workerResults = shallowRef([])
  const worker = new FilterWorker()
  const workerApi = Comlink.wrap(worker)

  watch(
    allCardsRef,
    (newCards) => {
      if (newCards && newCards.length > 0) {
        console.log('正在用新的卡片資料初始化 Worker...')
        workerApi.init(toRaw(newCards)).then(() => {
          workerResults.value = newCards
        })
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
    async (values) => {
      const plainFilters = {
        keyword: toRaw(values[0]),
        selectedCardTypes: toRaw(values[1]),
        selectedColors: toRaw(values[2]),
        selectedProductName: toRaw(values[3]),
        selectedTraits: toRaw(values[4]),
        selectedLevels: toRaw(values[5]),
        selectedRarities: toRaw(values[6]),
        showUniqueCards: toRaw(values[7]),
        selectedCostRange: toRaw(values[8]),
        selectedPowerRange: toRaw(values[9]),
      }

      const results = await workerApi.filter(plainFilters)
      workerResults.value = results
    },
    { deep: true }
  )

  const filteredCards = computed(() => workerResults.value)

  const resetFilters = () => {
    keyword.value = ''
    selectedCardTypes.value = []
    selectedColors.value = []
    selectedProductName.value = null
    selectedTraits.value = []
    selectedLevels.value = []
    selectedRarities.value = []
    showUniqueCards.value = false
    selectedCostRange.value = [costRangeRef.value.min, costRangeRef.value.max]
    selectedPowerRange.value = [powerRangeRef.value.min, powerRangeRef.value.max]
  }

  onUnmounted(() => {
    console.log('正在終止 Worker。')
    worker.terminate()
  })

  return {
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
  }
}
