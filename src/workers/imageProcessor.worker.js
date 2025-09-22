import { expose } from 'comlink'

class ImageBitmapCache {
  constructor(maxSize = 20) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(url) {
    if (this.cache.has(url)) {
      const bitmap = this.cache.get(url)
      this.cache.delete(url)
      this.cache.set(url, bitmap)
      return bitmap
    }
    return null
  }

  set(url, bitmap) {
    if (this.cache.has(url)) {
      const oldBitmap = this.cache.get(url)
      oldBitmap.close()
      this.cache.delete(url)
    }

    if (this.cache.size >= this.maxSize) {
      const [oldestUrl, oldestBitmap] = this.cache.entries().next().value
      oldestBitmap.close()
      this.cache.delete(oldestUrl)
      console.log(`[Worker] Evicted ImageBitmap: ${oldestUrl}`)
    }

    this.cache.set(url, bitmap)
    console.log(`[Worker] Cached ImageBitmap: ${url} (${this.cache.size}/${this.maxSize})`)
  }

  clear() {
    // eslint-disable-next-line no-unused-vars
    for (const [url, bitmap] of this.cache) {
      bitmap.close()
    }
    this.cache.clear()
    console.log('[Worker] Cleared all ImageBitmap cache')
  }

  has(url) {
    return this.cache.has(url)
  }
}

const imageCache = new ImageBitmapCache(20)

const loadImageBitmap = async (url) => {
  const cached = imageCache.get(url)
  if (cached) {
    return cached
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }

  const imageBlob = await response.blob()
  const bitmap = await createImageBitmap(imageBlob)

  imageCache.set(url, bitmap)
  return bitmap
}

const cropSpriteImage = async (url, coords) => {
  if (!url || !coords) {
    throw new Error('Image URL or coordinates are missing.')
  }

  const imageBitmap = await loadImageBitmap(url)
  const canvas = new OffscreenCanvas(coords.width, coords.height)
  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: false,
    willReadFrequently: false,
  })

  ctx.drawImage(
    imageBitmap,
    coords.x,
    coords.y,
    coords.width,
    coords.height,
    0,
    0,
    coords.width,
    coords.height,
  )

  const resultBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.75 })
  return resultBlob
}

expose({
  crop: cropSpriteImage,
})
