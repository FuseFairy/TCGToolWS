const assetModules = import.meta.glob(['/src/assets/**/*.webp', '/src/assets/**/*.json'], {
  eager: true,
  query: '?url',
  import: 'default',
})

export { assetModules }

export const getAssetsFile = (path) => {
  const fullPathInSrc = `/src/assets/${path}`
  return assetModules[fullPathInSrc]
}
