import JSONCrush from 'jsoncrush'
import LZString from 'lz-string'
import { useDeckStore } from '@/stores/deck'

export const useDeckEncoder = () => {
  const deckStore = useDeckStore()

  /**
   * Generates a 5-character random alphanumeric string and ensures it's unique within the savedDecks map.
   * @returns {string} A unique 5-character key.
   */
  const generateUniqueKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key
    do {
      key = ''
      for (let i = 0; i < 5; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length))
      }
    } while (deckStore.savedDecks[key])
    return key
  }

  /**
   * Compresses and saves the deck data.
   * @param {object} deckData - The deck data object { name, version, cards, seriesId }.
   * @returns {string} The unique key for the saved deck.
   */
  const encodeDeck = (deckData) => {
    const jsonString = JSON.stringify(deckData)
    const crushed = JSONCrush.crush(jsonString)
    const compressed = LZString.compressToUTF16(crushed)

    const key = generateUniqueKey()
    deckStore.saveEncodedDeck(key, compressed)
    console.log(`Deck saved with key: ${key}`, deckStore.savedDecks)
  }

  /**
   * Decompresses and retrieves deck data using a key.
   * @param {string} key - The key for the deck to retrieve.
   * @returns {object|null} The decompressed deck data or null if not found.
   */
  const decodeDeck = (key) => {
    const compressed = deckStore.savedDecks[key]
    if (!compressed) {
      return null
    }
    const crushed = LZString.decompressFromUTF16(compressed)
    const jsonString = JSONCrush.uncrush(crushed)
    return JSON.parse(jsonString)
  }

  return {
    encodeDeck,
    decodeDeck,
  }
}
