import { snapdom } from '@zumer/snapdom'

const waitForImagesToLoad = async (element) => {
  const images = Array.from(element.querySelectorAll('img'))
  const blobUrls = []
  const promises = images.map(async (img) => {
    if (img.src && !img.src.startsWith('data:')) {
      try {
        const response = await fetch(img.src, { cache: 'reload' })
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }
        const imageBlob = await response.blob()
        const blobUrl = URL.createObjectURL(imageBlob)
        blobUrls.push(blobUrl)
        img.src = blobUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
      } catch (error) {
        console.error(`Could not reload image ${img.src}:`, error)
        throw error
      }
    }
  })

  await Promise.all(promises)
  return blobUrls
}

export const convertElementToPng = async (elementId, name) => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with ID "${elementId}" not found.`)
    return
  }

  let tempBlobUrls = []

  try {
    tempBlobUrls = await waitForImagesToLoad(element)

    const rect = element.getBoundingClientRect()
    const options = {
      width: rect.width,
      height: rect.height,
      dpr: window.devicePixelRatio,
      scale: 2,
      type: 'png',
    }
    const result = await snapdom(element, options)
    await result.download({ format: 'png', filename: name })
  } catch (error) {
    console.error('Error during PNG conversion:', error)
    throw error
  } finally {
    console.log('Cleaning up temporary blob URLs...')
    tempBlobUrls.forEach((url) => URL.revokeObjectURL(url))
  }
}
