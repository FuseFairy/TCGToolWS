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
      if (isDeckFull.value) {
        console.warn('Deck is full. Cannot add more cards.')
        return false
      }

      const cardId = card.id
      if (cardsInDeck.value[cardId]) {
        cardsInDeck.value[cardId].quantity++
      } else {
        cardsInDeck.value[cardId] = {
          id: cardId,
          cardIdPrefix: card.cardIdPrefix,
          product_name: card.product_name,
          level: card.level,
          color: card.color,
          cost: card.cost,
          type: card.type,
          quantity: 1,
        }
      }
      return true
    }

    const removeCard = (cardId) => {
      if (!cardsInDeck.value[cardId]) return

      const cardInDeck = cardsInDeck.value[cardId]
      cardInDeck.quantity--

      if (cardInDeck.quantity <= 0) {
        delete cardsInDeck.value[cardId]
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
