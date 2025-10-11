import { customAlphabet } from 'nanoid'
import JSONCrush from 'jsoncrush'
import pako from 'pako'
import { useDeckStore } from '@/stores/deck'

export const useDeckEncoder = () => {
  const deckStore = useDeckStore()
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const nanoid = customAlphabet(alphabet, 6)

  /**
   * Compresses and saves the deck data.
   * @param {object} deckData - The deck data object { name, version, cards, seriesId }.
   * @param {object} [options] - Optional parameters.
   * @param {string|null} [options.existingKey=null] - The existing key if the deck is being updated.
   * @param {boolean} [options.isSharedDeck=false] - Whether the deck is a shared deck.
   * @returns {Promise<{key: string}>} An object containing the key of the saved deck.
   */
  const encodeDeck = async (deckData, { existingKey = null, isSharedDeck = false } = {}) => {
    const jsonString = JSON.stringify(deckData)
    const crushed = JSONCrush.crush(jsonString)
    const compressedUint8 = pako.gzip(crushed)
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

  /**
   * Decompresses and retrieves deck data using a key.
   * @param {string} key - The key for the deck to retrieve.
   * @returns {object|null} The decompressed deck data or null if not found.
   */
  const decodeDeck = async (key, isSharedDeck = false) => {
    let compressed

    try {
      if (isSharedDeck) {
        const fetchedDeck = await deckStore.fetchDeckByKey(key)
        if (!fetchedDeck) {
          return null
        }
        compressed = fetchedDeck.deck_data
      } else {
        compressed = deckStore.savedDecks[key]

        if (!compressed) {
          throw new Error('卡组不存在或已删除')
        }
      }
    } catch (error) {
      console.error('Failed to fetch deck via decodeDeck:', error.message)
      throw error
    }

    const crushed = pako.ungzip(compressed, { to: 'string' })
    const jsonString = JSONCrush.uncrush(crushed)
    return JSON.parse(jsonString)
  }

  return {
    encodeDeck,
    decodeDeck,
  }
}
