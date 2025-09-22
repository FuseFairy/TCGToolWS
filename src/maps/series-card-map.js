import { assetModules } from '@/utils/getAssetsFile.js'

const allSeriesCardPaths = Object.keys(assetModules)
  .filter((fullPath) => fullPath.startsWith('/src/assets/card/data/'))
  .map((fullPath) => fullPath.substring('/src/assets/'.length))

export const findSeriesDataFileName = (prefixes = []) => {
  if (!prefixes.length) {
    return []
  }

  const lowerCasePrefixes = prefixes.map((p) => p.toLowerCase())
  const result = []

  for (const path of allSeriesCardPaths) {
    const fileName = path.split('/').pop().toLowerCase()
    for (const prefix of lowerCasePrefixes) {
      if (fileName.startsWith(prefix)) {
        result.push(path)
        break
      }
    }
  }

  return result
}
