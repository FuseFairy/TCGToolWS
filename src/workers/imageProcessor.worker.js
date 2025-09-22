import { expose } from 'comlink'

const imageCache = new Map()

const loadImageBitmap = async (url) => {
  if (imageCache.has(url)) {
    return imageCache.get(url)
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
    desynchronized: true,
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
