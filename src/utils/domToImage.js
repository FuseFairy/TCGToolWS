import { snapdom } from '@zumer/snapdom'

export const convertElementToPng = async (elementId, name) => {
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
      dpr: window.devicePixelRatio,
      scale: 2,
      type: 'png',
    }
    const result = await snapdom(element, options)
    await result.download({ format: 'png', filename: name })
  } catch (error) {
    console.error('Error during PNG conversion:', error)
    throw error
  }
}
