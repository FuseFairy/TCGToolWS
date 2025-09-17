const assetModules = import.meta.glob('/src/assets/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const getAssetsFile = (path) => {
  const fullPathInSrc = `/src/assets/${path}`
  return assetModules[fullPathInSrc]
}
