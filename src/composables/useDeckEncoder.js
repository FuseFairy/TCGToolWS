import { customAlphabet } from 'nanoid'
import { useDeckStore } from '@/stores/deck'
import { wrap } from 'comlink'
import { onUnmounted, toRaw } from 'vue'
import DeckWorker from '@/workers/deck.worker.js?worker'

export const useDeckEncoder = () => {
  const deckStore = useDeckStore()
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const nanoid = customAlphabet(alphabet, 6)

  const workerInstance = new DeckWorker()
  const deckWorker = wrap(workerInstance)

  onUnmounted(() => {
    workerInstance.terminate()
  })

  const encodeDeck = async (deckData, { existingKey = null, isSharedDeck = false } = {}) => {
    const compressedUint8 = await deckWorker.compress(deckData)

    const key = existingKey || nanoid()

    try {
      if (existingKey) {
        await deckStore.updateEncodedDeck(key, compressedUint8)
      } else {
        await deckStore.saveEncodedDeck(key, compressedUint8, isSharedDeck)
      }
      console.log(`Deck saved with key: ${key}`)
      return { key }
    } catch (error) {
      console.error('Failed to save deck via encodeDeck:', error.message)
      throw error
    }
  }

  const decodeDeck = async (key, isSharedDeck = false) => {
    let compressed

    try {
      if (isSharedDeck) {
        const fetchedDeck = await deckStore.fetchDeckByKey(key)
        if (!fetchedDeck) return null
        compressed = fetchedDeck.deck_data
      } else {
        compressed = deckStore.savedDecks[key]
        if (!compressed) throw new Error('卡组不存在或已删除')
      }
    } catch (error) {
      console.error('Failed to fetch deck via decodeDeck:', error.message)
      throw error
    }

    return await deckWorker.decompress(toRaw(compressed))
  }

  return {
    encodeDeck,
    decodeDeck,
  }
}
