import { computed } from 'vue'

/**
 * A composable function to handle card navigation logic.
 * @param {import('vue').Ref<Array>} cards - A ref to the array of cards.
 * @param {import('vue').Ref<object>} selectedCard - A ref to the currently selected card object.
 * @returns {{selectedCardIndex: import('vue').ComputedRef<number>, getPrevCard: () => object|null, getNextCard: () => object|null}}
 */
export function useCardNavigation(cards, selectedCard) {
  const selectedCardIndex = computed(() => {
    if (!selectedCard.value) {
      return -1
    }
    return cards.value.findIndex((c) => c.id === selectedCard.value.id)
  })

  const getPrevCard = () => {
    if (selectedCardIndex.value > 0) {
      return cards.value[selectedCardIndex.value - 1]
    }
    return null
  }

  const getNextCard = () => {
    if (selectedCardIndex.value < cards.value.length - 1) {
      return cards.value[selectedCardIndex.value + 1]
    }
    return null
  }

  return {
    selectedCardIndex,
    getPrevCard,
    getNextCard,
  }
}
