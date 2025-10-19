import { assetModules } from '@/utils/getAssetsFile.js'

const allSeriesCardPaths = Object.keys(assetModules)
  .filter((fullPath) => fullPath.startsWith('/src/assets/card-data/'))
  .map((fullPath) => fullPath.substring('/src/assets/'.length))

export const findSeriesDataFileName = (prefixes = []) => {
  if (!prefixes.length) {
    return []
  }

  const prefixesSet = new Set(prefixes.map((p) => p.toLowerCase()))

  const result = allSeriesCardPaths.filter((path) => {
    const fileName = path.split('/').pop().toLowerCase()
    const fileNamePart = fileName.split('-')[0]

    return prefixesSet.has(fileNamePart)
  })

  return result
}
