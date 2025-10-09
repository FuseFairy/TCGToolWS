import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useUIStore } from './ui'
import { useSnackbar } from '@/composables/useSnackbar'

export const useDeckStore = defineStore(
  'deck',
  () => {
    const version = ref(1)
    const cardsInDeck = ref({})
    const seriesId = ref('')
    const savedDecks = ref({})
    const maxDeckSize = 50

    const authStore = useAuthStore()
    const uiStore = useUIStore()
    const { triggerSnackbar } = useSnackbar()

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

    const setSeriesId = (id) => {
      seriesId.value = id
    }

    const saveEncodedDeck = async (key, compressedData, isSharedDeck = false) => {
      if (!authStore.token) {
        triggerSnackbar('请先登入', 'error')
        return false
      }
      uiStore.setLoading(true)
      try {
        const response = await fetch('/api/decks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify({
            key,
            deckData: compressedData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '上传卡组失败')
        }

        savedDecks.value[key] = compressedData
        if (!isSharedDeck) {
          cardsInDeck.value = {}
        }
        triggerSnackbar('保存成功')
        return true
      } catch (error) {
        console.error('Error saving deck:', error)
        triggerSnackbar(error.message, 'error')
        return false
      } finally {
        uiStore.setLoading(false)
      }
    }

    const fetchDecks = async () => {
      if (!authStore.token) return
      uiStore.setLoading(true)
      try {
        const response = await fetch('/api/decks', {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        })
        if (!response.ok) {
          throw new Error('Failed to fetch decks')
        }
        const decks = await response.json()
        savedDecks.value = decks.reduce((acc, deck) => {
          acc[deck.key] = deck.deck_data
          return acc
        }, {})
      } catch (error) {
        console.error('Error fetching decks:', error)
        triggerSnackbar(error.message, 'error')
      } finally {
        uiStore.setLoading(false)
      }
    }

    const fetchDeckByKey = async (key) => {
      uiStore.setLoading(true)
      try {
        const response = await fetch(`/api/shared-decks/${key}`)
        if (!response.ok) {
          throw new Error('Failed to fetch deck')
        }
        return await response.json()
      } catch (error) {
        console.error(`Error fetching deck with key ${key}:`, error)
        triggerSnackbar(error.message, 'error')
        return null
      } finally {
        uiStore.setLoading(false)
      }
    }

    const deleteDeck = async (key) => {
      if (!authStore.token) {
        triggerSnackbar('请先登入', 'error')
        return false
      }
      try {
        const response = await fetch(`/api/decks/${key}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '删除卡组失败')
        }

        delete savedDecks.value[key]
        triggerSnackbar('卡组删除成功', 'success')
        return true
      } catch (error) {
        console.error('Error deleting deck:', error)
        triggerSnackbar(error.message, 'error')
        return false
      }
    }
    return {
      version,
      cardsInDeck,
      getCardCount,
      totalCardCount,
      seriesId,
      addCard,
      removeCard,
      clearDeck,
      isDeckFull,
      setSeriesId,
      savedDecks,
      saveEncodedDeck,
      fetchDecks,
      fetchDeckByKey,
      deleteDeck,
    }
  },
  {
    persist: {
      storage: localStorage,
    },
  }
)
