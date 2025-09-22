import { getAssetsFile } from '@/utils/getAssetsFile.js'

const cache = new Map()

export const loadSpriteSheet = async (name) => {
  if (!name) {
    throw new Error('Sprite name cannot be empty.')
  }

  if (cache.has(name)) {
    return cache.get(name)
  }

  const promise = (async () => {
    try {
      const relativeImagePath = `card/spritesheets/${name}.webp`
      const relativeJsonPath = `card/spritesheets/${name}.json`

      const imageUrl = getAssetsFile(relativeImagePath)
      const jsonUrl = getAssetsFile(relativeJsonPath)

      if (!imageUrl || !jsonUrl) {
        throw new Error(`Assets not found for sprite: ${name}`)
      }

      const response = await fetch(jsonUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const metadata = await response.json()

      const result = { imageUrl, metadata }
      cache.set(name, result)
      return result
    } catch (error) {
      cache.delete(name)
      throw error
    }
  })()

  cache.set(name, promise)
  return promise
}
