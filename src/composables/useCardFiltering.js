import { ref, computed } from 'vue'

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
  const selectedProductName = ref(null)
  const selectedTraits = ref([])
  const selectedLevels = ref([])
  const selectedRarities = ref([])
  const showUniqueCards = ref(false)
  const selectedCostRange = ref([0, 0])
  const selectedPowerRange = ref([0, 0])

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

  const filteredCards = computed(() => {
    let filtered = allCardsRef.value

    if (keyword.value) {
      const lowerCaseKeyword = keyword.value.toLowerCase()
      filtered = filtered.filter(
        (card) =>
          card.baseId.toLowerCase().includes(lowerCaseKeyword) ||
          card.id.toLowerCase().includes(lowerCaseKeyword) ||
          (card.effect && card.effect.toLowerCase().includes(lowerCaseKeyword)) ||
          card.name.toLowerCase().includes(lowerCaseKeyword)
      )
    }

    if (selectedCardTypes.value.length > 0) {
      filtered = filtered.filter((card) => selectedCardTypes.value.includes(card.type))
    }

    if (selectedColors.value.length > 0) {
      filtered = filtered.filter((card) => selectedColors.value.includes(card.color))
    }

    if (selectedProductName.value) {
      filtered = filtered.filter((card) => card.product_name === selectedProductName.value)
    }

    if (selectedTraits.value.length > 0) {
      filtered = filtered.filter((card) =>
        selectedTraits.value.every((trait) => card.trait && card.trait.includes(trait))
      )
    }

    const toLevel = (level) => (level === '-' ? 0 : +level)
    if (selectedLevels.value.length > 0) {
      const mappedLevels = new Set(selectedLevels.value.map(toLevel))
      filtered = filtered.filter((card) => mappedLevels.has(toLevel(card.level)))
    }

    if (
      selectedCostRange.value &&
      (selectedCostRange.value[0] !== costRangeRef.value.min ||
        selectedCostRange.value[1] !== costRangeRef.value.max)
    ) {
      filtered = filtered.filter(
        (card) => card.cost >= selectedCostRange.value[0] && card.cost <= selectedCostRange.value[1]
      )
    }

    if (
      selectedPowerRange.value &&
      (selectedPowerRange.value[0] !== powerRangeRef.value.min ||
        selectedPowerRange.value[1] !== powerRangeRef.value.max)
    ) {
      filtered = filtered.filter(
        (card) =>
          card.power >= selectedPowerRange.value[0] && card.power <= selectedPowerRange.value[1]
      )
    }

    if (selectedRarities.value.length > 0) {
      filtered = filtered.filter((card) => selectedRarities.value.includes(card.rarity))
    }

    if (showUniqueCards.value) {
      const seenBaseIds = new Set()
      filtered = filtered.filter((card) => {
        if (seenBaseIds.has(card.baseId)) {
          return false
        }
        seenBaseIds.add(card.baseId)
        return true
      })
    }

    return filtered
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
