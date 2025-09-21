export const seriesMap = {
  'Angel Beats!／クドわふたー': {
    id: 'angel-beats-0', // 給一個唯一的 ID
    prefixes: ['AB', 'KW', 'Kab', 'Hab'],
    icon: 'angelbeats.webp',
  },
}

const isDevelopment = import.meta.env.DEV

if (isDevelopment) {
  for (let i = 1; i <= 100; i++) {
    const key = `Angel Beats!／クドわふたー${i}`

    seriesMap[key] = {
      id: `angel-beats-${i}`,
      prefixes: ['AB', 'KW', 'Kab', 'Hab'],
      icon: 'angelbeats.webp',
    }
  }
}
