import { snapdom } from '@zumer/snapdom'

const waitForImagesToLoad = (element) => {
  const images = Array.from(element.querySelectorAll('img'))
  const promises = images.map((img) => {
    if (img.src && !img.src.startsWith('data:')) {
      return new Promise((resolve, reject) => {
        if (img.complete) {
          if (img.naturalWidth === 0) {
            return reject(new Error(`Image could not be loaded: ${img.src}`))
          }
          return resolve()
        }
        img.onload = resolve
        img.onerror = reject
      })
    }
    return Promise.resolve()
  })

  return Promise.all(promises)
}

const attemptCapture = async (element, options, name, useCacheBust) => {
  if (useCacheBust) {
    console.log('Attempting capture with cache busting...')
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
  }

  await waitForImagesToLoad(element)

  const result = await snapdom(element, options)
  await result.download({ format: 'png', filename: name })
}

export const convertElementToPng = async (elementId, name) => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with ID "${elementId}" not found.`)
    return
  }

  const rect = element.getBoundingClientRect()
  const options = {
    width: rect.width,
    height: rect.height,
    dpr: window.devicePixelRatio,
    scale: 2,
    type: 'png',
  }

  try {
    await attemptCapture(element, options, name, false)
  } catch (error) {
    console.warn('Initial conversion failed. Retrying with cache busting.', error)
    try {
      await attemptCapture(element, options, name, true)
    } catch (retryError) {
      console.error('Error during PNG conversion even after retry:', retryError)
      throw retryError
    }
  }
}
