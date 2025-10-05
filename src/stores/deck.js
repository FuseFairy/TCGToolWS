import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDeckStore = defineStore(
  'deck',
  () => {
    const cardsInDeck = ref({})
    const maxDeckSize = 50

    const getCardCount = computed(() => {
      return (cardId) => cardsInDeck.value[cardId]?.quantity || 0
    })

    const totalCardCount = computed(() => {
      return Object.values(cardsInDeck.value).reduce((sum, item) => sum + item.quantity, 0)
    })

    const isDeckFull = computed(() => totalCardCount.value >= maxDeckSize)

    const addCard = (card) => {
      if (!card || !card.id) return false
      if (isDeckFull.value) {
        console.warn('Deck is full. Cannot add more cards.')
        return false
      }

      if (cardsInDeck.value[card.id]) {
        cardsInDeck.value[card.id].quantity++
      } else {
        cardsInDeck.value[card.id] = {
          card: card,
          quantity: 1,
        }
      }
      return true
    }

    const removeCard = (card) => {
      if (!card || !card.id || !cardsInDeck.value[card.id]) return

      const cardInDeck = cardsInDeck.value[card.id]
      cardInDeck.quantity--

      if (cardInDeck.quantity <= 0) {
        delete cardsInDeck.value[card.id]
      }
    }

    const clearDeck = () => {
      cardsInDeck.value = {}
    }

    return {
      cardsInDeck,
      getCardCount,
      totalCardCount,
      addCard,
      removeCard,
      clearDeck,
      isDeckFull,
    }
  },
  {
    persist: {
      storage: localStorage,
    },
  }
)
