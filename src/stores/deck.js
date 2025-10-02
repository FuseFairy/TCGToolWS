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

    function addCard(card) {
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

    function removeCard(card) {
      if (!card || !card.id || !cardsInDeck.value.has(card.id)) return

      const cardInDeck = cardsInDeck.value.get(card.id)
      cardInDeck.quantity--

      if (cardInDeck.quantity <= 0) {
        cardsInDeck.value.delete(card.id)
      }
    }

    return { cardsInDeck, getCardCount, addCard, removeCard }
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
