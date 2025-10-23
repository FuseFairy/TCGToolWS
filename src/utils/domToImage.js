import { snapdom } from '@zumer/snapdom'

const waitForImagesToLoad = (element) => {
  const images = Array.from(element.querySelectorAll('img'))
  const promises = images.map((img) => {
    if (img.src && !img.src.startsWith('data:')) {
      return new Promise((resolve) => {
        if (img.complete) {
          return resolve()
        }
        img.onload = resolve
        img.onerror = resolve
      })
    }
    return Promise.resolve()
  })

  return Promise.all(promises)
}

export const convertElementToPng = async (elementId, name) => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with ID "${elementId}" not found.`)
    return
  }

  try {
    const images = element.querySelectorAll('img')
    images.forEach((img) => {
      if (!img.src) return
      try {
        const url = new URL(img.src)
        url.searchParams.set('cache_bust', new Date().getTime())
        img.src = url.toString()
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        console.warn(`Could not bust cache for a non-URL src: ${img.src}`)
      }
    })

    await waitForImagesToLoad(element)

    const rect = element.getBoundingClientRect()
    const options = {
      width: rect.width,
      height: rect.height,
      dpr: window.devicePixelRatio,
      scale: 2,
      type: 'png',
      cache: 'disabled',
    }
    const result = await snapdom(element, options)
    await result.download({ format: 'png', filename: name })
  } catch (error) {
    console.error('Error during PNG conversion:', error)
    throw error
  }
}
