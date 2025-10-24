// 專門用於全域搜索的 JSON 資料載入
const cardDataModules = import.meta.glob('/src/assets/card-data/**/*.json')

export { cardDataModules }

export const getCardDataFile = async (path) => {
  const fullPathInSrc = `/src/assets/${path}`
  if (cardDataModules[fullPathInSrc]) {
    const module = await cardDataModules[fullPathInSrc]()
    return module.default || module
  }
  return undefined
}

// 獲取所有卡片資料檔案路徑
export const getAllCardDataPaths = () => {
  return Object.keys(cardDataModules)
    .filter((fullPath) => fullPath.startsWith('/src/assets/card-data/'))
    .map((fullPath) => fullPath.substring('/src/assets/'.length))
}
