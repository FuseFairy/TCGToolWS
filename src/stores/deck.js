import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDeckStore = defineStore(
  'deck',
  () => {
    const cardsInDeck = ref(new Map())
    const maxDeckSize = 50

    const getCardCount = computed(() => {
      return (cardId) => cardsInDeck.value.get(cardId)?.quantity || 0
    })

    const totalCardCount = computed(() => {
      return Array.from(cardsInDeck.value.values()).reduce((sum, item) => sum + item.quantity, 0)
    })

    const isDeckFull = computed(() => totalCardCount.value >= maxDeckSize)

    const addCard = (card) => {
      if (!card || !card.id) return false
      if (isDeckFull.value) {
        console.warn('Deck is full. Cannot add more cards.')
        return false
      }

      if (cardsInDeck.value.has(card.id)) {
        cardsInDeck.value.get(card.id).quantity++
      } else {
        cardsInDeck.value.set(card.id, {
          card: card,
          quantity: 1,
        })
      }
      return true
    }

    const removeCard = (card) => {
      if (!card || !card.id || !cardsInDeck.value.has(card.id)) return

      const cardInDeck = cardsInDeck.value.get(card.id)
      cardInDeck.quantity--

      if (cardInDeck.quantity <= 0) {
        cardsInDeck.value.delete(card.id)
      }
    }

    const clearDeck = () => {
      cardsInDeck.value.clear()
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
      serializer: {
        serialize: (value) => {
          return JSON.stringify(Array.from(value.entries()))
        },
        deserialize: (value) => {
          return new Map(JSON.parse(value))
        },
      },
    },
  }
)
