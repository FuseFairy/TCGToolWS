// stores/deck.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDeckStore = defineStore(
  'deck',
  () => {
    const cardsInDeck = ref(new Map())

    const getCardCount = computed(() => {
      return (cardId) => cardsInDeck.value.get(cardId)?.quantity || 0
    })

    const totalCardCount = computed(() => {
      return Array.from(cardsInDeck.value.values()).reduce((sum, card) => sum + card.quantity, 0)
    })

    const addCard = (card) => {
      if (!card || !card.id) return

      if (cardsInDeck.value.has(card.id)) {
        cardsInDeck.value.get(card.id).quantity++
      } else {
        cardsInDeck.value.set(card.id, {
          id: card.id,
          cardIdPrefix: card.cardIdPrefix,
          quantity: 1,
        })
      }
    }

    const removeCard = (card) => {
      if (!card || !card.id || !cardsInDeck.value.has(card.id)) return

      const cardInDeck = cardsInDeck.value.get(card.id)
      cardInDeck.quantity--

      if (cardInDeck.quantity <= 0) {
        cardsInDeck.value.delete(card.id)
      }
    }

    return { cardsInDeck, getCardCount, totalCardCount, addCard, removeCard }
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
