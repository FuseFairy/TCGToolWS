import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const useDeckStore = defineStore(
  'deck',
  () => {
    // --- 狀態 (State) ---
    const version = ref(1)
    const cardsInDeck = ref({})
    const seriesId = ref('')
    const deckName = ref('')
    const coverCardId = ref('')
    const storeKey = ref('')
    const savedDecks = ref({})
    const maxDeckSize = 50

    const authStore = useAuthStore()

    // --- 計算屬性 (Getters / Computed) ---
    const getCardCount = computed(() => {
      return (cardId) => cardsInDeck.value[cardId]?.quantity || 0
    })

    const totalCardCount = computed(() => {
      return Object.values(cardsInDeck.value).reduce((sum, item) => sum + item.quantity, 0)
    })

    const isDeckFull = computed(() => totalCardCount.value >= maxDeckSize)

    // --- 同步操作 (Actions) ---
    const addCard = (card) => {
      if (isDeckFull.value) {
        console.warn('卡组已满，无法添加更多卡片。')
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

    const loadDeckForEditing = (deck, key) => {
      cardsInDeck.value = deck.cards
      seriesId.value = deck.seriesId
      deckName.value = deck.name
      coverCardId.value = deck.coverCardId
      storeKey.value = key
    }

    const clearEditingInfo = () => {
      deckName.value = ''
      coverCardId.value = ''
      storeKey.value = ''
    }

    // --- 非同步操作 (Async Actions) ---

    /**
     * 保存卡组。如果API调用失败，将抛出一个错误。
     */
    const saveEncodedDeck = async (key, compressedData, isSharedDeck = false) => {
      if (!authStore.token) {
        throw new Error('请先登入')
      }

      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: JSON.stringify({ key, deckData: compressedData }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '保存卡组失败')
      }

      savedDecks.value[key] = compressedData
      if (!isSharedDeck) {
        cardsInDeck.value = {}
      }
    }

    /**
     * 更新现有卡组。
     */
    const updateEncodedDeck = async (key, compressedData) => {
      if (!authStore.token) {
        throw new Error('请先登入')
      }

      const response = await fetch(`/api/decks/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: JSON.stringify({ deckData: compressedData }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '更新卡组失败')
      }

      savedDecks.value[key] = compressedData
    }

    /**
     * 获取用户的所有卡组。
     */
    const fetchDecks = async () => {
      if (!authStore.token) {
        throw new Error('请先登入')
      }

      const response = await fetch('/api/decks', {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '获取卡组列表失败')
      }

      const decks = await response.json()
      savedDecks.value = decks.reduce((acc, deck) => {
        acc[deck.key] = deck.deck_data
        return acc
      }, {})
    }

    /**
     * 获取一个公开分享的卡组。
     */
    const fetchDeckByKey = async (key) => {
      const response = await fetch(`/api/shared-decks/${key}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '获取卡组失败')
      }

      return await response.json()
    }

    /**
     * 删除一个卡组。
     */
    const deleteDeck = async (key) => {
      if (!authStore.token) {
        throw new Error('请先登入')
      }

      const response = await fetch(`/api/decks/${key}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '删除卡组失败')
      }

      delete savedDecks.value[key]

      if (storeKey.value === key) {
        clearEditingInfo()
      }
    }

    return {
      version,
      cardsInDeck,
      getCardCount,
      totalCardCount,
      seriesId,
      deckName,
      coverCardId,
      storeKey,
      addCard,
      removeCard,
      clearDeck,
      isDeckFull,
      setSeriesId,
      loadDeckForEditing,
      clearEditingInfo,
      savedDecks,
      saveEncodedDeck,
      updateEncodedDeck,
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
