import { snapdom } from '@zumer/snapdom'

export async function convertElementToPng(elementId, isTouch, name) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with ID "${elementId}" not found.`)
    return
  }
  try {
    const rect = element.getBoundingClientRect()
    const options = {
      width: rect.width,
      height: rect.height,
      dpr: isTouch ? 1 : window.devicePixelRatio,
      scale: isTouch ? 1 : 2,
    }
    const result = await snapdom(element, options)

    // 2. The actual capture, now running with a clean cache.
    // eslint-disable-next-line no-unused-vars
    const img = await result.toPng()

    await result.download({ format: 'png', filename: name })
  } catch (error) {
    console.error('Error during PNG conversion:', error)
    throw error
  }
}
