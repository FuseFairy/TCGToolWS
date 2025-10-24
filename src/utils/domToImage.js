import { snapdom } from '@zumer/snapdom'

/**
 * 快速檢測一個圖片元素是否受到 CORS 污染。
 * @param {HTMLImageElement} img - 已載入的圖片元素。
 * @returns {boolean} 如果受污染則回傳 true，否則回傳 false。
 */
const isImageTainted = (img) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight

  try {
    ctx.drawImage(img, 0, 0)
    canvas.toDataURL()
    return false
  } catch (error) {
    return error.name === 'SecurityError'
  }
}

export const convertElementToPng = async (elementId, name) => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with ID "${elementId}" not found.`)
    return
  }

  const tempBlobUrls = []

  try {
    const images = Array.from(element.querySelectorAll('img'))

    const imageProcessingPromises = images.map(async (img) => {
      if (!img.src || img.src.startsWith('data:')) {
        return
      }

      if (!img.complete) {
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
      }

      // 進行 CORS 檢查，失敗的才需要處理
      if (isImageTainted(img)) {
        console.warn(`Image ${img.src} is tainted by CORS. Re-fetching...`)
        try {
          const response = await fetch(img.src, { cache: 'reload' })
          if (!response.ok) {
            throw new Error(`Failed to re-fetch image: ${response.statusText}`)
          }
          const imageBlob = await response.blob()
          const blobUrl = URL.createObjectURL(imageBlob)
          tempBlobUrls.push(blobUrl)
          img.src = blobUrl

          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
          })
        } catch (fetchError) {
          console.error(`Failed to resolve CORS issue for ${img.src}:`, fetchError)
          throw fetchError
        }
      }
    })

    await Promise.all(imageProcessingPromises)

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
