export const getCroppedBlob = (canvas) => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.75)
  })
}

export const cropSpriteImage = async (url, coords) => {
  if (!url || !coords) {
    throw new Error('Image URL or coordinates are missing.')
  }

  const image = new Image()
  image.crossOrigin = 'Anonymous'
  image.src = url

  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = (err) => reject(new Error(`Failed to load image: ${url}`, { cause: err }))
  })

  const canvas = document.createElement('canvas')
  canvas.width = coords.width
  canvas.height = coords.height
  const ctx = canvas.getContext('2d', { alpha: false })

  ctx.drawImage(
    image,
    coords.x,
    coords.y,
    coords.width,
    coords.height,
    0,
    0,
    coords.width,
    coords.height,
  )

  return await getCroppedBlob(canvas)
}
