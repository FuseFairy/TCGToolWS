import { getAssetsFile } from '@/utils/getAssetsFile.js'

export const fetchCardByIdAndPrefix = async (id, prefix) => {
  try {
    const path = `card-data/${prefix}.json`
    const url = getAssetsFile(path)
    const response = await fetch(url, { priority: 'high' })
    if (!response.ok) throw new Error(`Failed to fetch ${path}`)

    const fileContent = await response.json()

    let baseId = null
    let cardData = null

    for (const key in fileContent) {
      if (key === id) {
        baseId = key
        cardData = fileContent[key]
        break
      }
      if (fileContent[key].all_cards && Array.isArray(fileContent[key].all_cards)) {
        if (fileContent[key].all_cards.some((cardVersion) => cardVersion.id === id)) {
          baseId = key
          cardData = fileContent[key]
          break
        }
      }
    }

    if (!cardData) {
      console.warn(`Card with ID "${id}" not found in prefix "${prefix}"`)
      return null
    }

    const cardIdPrefix = path.split('/').pop().replace('.json', '')
    const { all_cards, ...baseCardData } = cardData

    if (all_cards && Array.isArray(all_cards)) {
      const foundCardVersion = all_cards.find((cardVersion) => cardVersion.id === id)
      if (foundCardVersion) {
        return {
          ...baseCardData,
          ...foundCardVersion,
          baseId: baseId,
          cardIdPrefix: cardIdPrefix,
        }
      }
    }

    // If the requested ID is a base ID or no specific version found, return the base card data merged with itself
    return {
      ...baseCardData,
      baseId: baseId,
      cardIdPrefix: cardIdPrefix,
    }
  } catch (e) {
    console.error(`Failed to load card ${id} with prefix ${prefix}:`, e)
    return null
  }
}

export const fetchCardsByBaseIdAndPrefix = async (baseId, prefix) => {
  try {
    const path = `card-data/${prefix}.json`
    const url = getAssetsFile(path)
    const response = await fetch(url, { priority: 'high' })
    if (!response.ok) throw new Error(`Failed to fetch ${path}`)

    const fileContent = await response.json()
    const cardData = fileContent[baseId]

    if (!cardData) {
      console.warn(`Base card with ID "${baseId}" not found in prefix "${prefix}"`)
      return []
    }

    const cardIdPrefix = path.split('/').pop().replace('.json', '')
    const { all_cards, ...baseCardData } = cardData

    const allVersions = []
    if (all_cards && Array.isArray(all_cards)) {
      all_cards.forEach((cardVersion) => {
        allVersions.push({
          ...baseCardData,
          ...cardVersion,
          baseId: baseId,
          cardIdPrefix: cardIdPrefix,
        })
      })
    } else {
      // If no all_cards array, return the base card itself as the only version
      allVersions.push({
        ...baseCardData,
        baseId: baseId,
        cardIdPrefix: cardIdPrefix,
      })
    }
    return allVersions
  } catch (e) {
    console.error(`Failed to load cards for baseId ${baseId} with prefix ${prefix}:`, e)
    return []
  }
}
