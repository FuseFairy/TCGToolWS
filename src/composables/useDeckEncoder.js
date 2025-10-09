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
   * @returns {Promise<boolean>} True if the deck was saved successfully, false otherwise.
   */
  const encodeDeck = async (deckData) => {
    const jsonString = JSON.stringify(deckData)
    const crushed = JSONCrush.crush(jsonString)
    const compressedUint8 = pako.gzip(crushed)

    const key = nanoid()
    const success = await deckStore.saveEncodedDeck(key, compressedUint8)
    if (success) {
      console.log(`Deck saved with key: ${key}`)
    }
    return { success, key }
  }

  /**
   * Decompresses and retrieves deck data using a key.
   * @param {string} key - The key for the deck to retrieve.
   * @returns {object|null} The decompressed deck data or null if not found.
   */
  const decodeDeck = async (key, isSharedDeck = false) => {
    let compressed
    if (isSharedDeck) {
      const fetchedDeck = await deckStore.fetchDeckByKey(key)
      if (!fetchedDeck) {
        return null
      }
      compressed = fetchedDeck.deck_data
    } else {
      compressed = deckStore.savedDecks[key]
    }

    if (!compressed) {
      return null
    }

    // compressed 可能是 Uint8Array 或 ArrayBuffer，需要確保 pako 能處理
    // 如果是 ArrayBuffer，需要轉換為 Uint8Array
    const compressedUint8 =
      compressed instanceof ArrayBuffer ? new Uint8Array(compressed) : compressed

    const crushed = pako.ungzip(compressedUint8, { to: 'string' })
    const jsonString = JSONCrush.uncrush(crushed)
    return JSON.parse(jsonString)
  }

  return {
    encodeDeck,
    decodeDeck,
  }
}
