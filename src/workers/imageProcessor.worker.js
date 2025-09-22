import { expose } from 'comlink'

const cropSpriteImage = async (url, coords) => {
  if (!url || !coords) {
    throw new Error('Image URL or coordinates are missing.')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }
  const imageBlob = await response.blob()
  const imageBitmap = await createImageBitmap(
    imageBlob,
    coords.x,
    coords.y,
    coords.width,
    coords.height,
  )

  const canvas = new OffscreenCanvas(coords.width, coords.height)
  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
    willReadFrequently: false,
  })

  ctx.drawImage(imageBitmap, 0, 0)

  const resultBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.75 })

  imageBitmap.close()

  return resultBlob
}

expose({
  crop: cropSpriteImage,
})
