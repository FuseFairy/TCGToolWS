import { computed } from 'vue'

// 從 Vite 環境變數讀取基礎 URL
const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL

/**
 * 根據業務規則轉換 cardId 為路徑格式
 * e.g., "AB/W11-101TD" -> "ab-w11/101td"
 * @param {string} cardId - 原始卡片 ID
 * @returns {string|null} - 轉換後的路徑片段，或在格式錯誤時返回 null
 */
function formatCardIdToPath(cardId) {
  if (!cardId || typeof cardId !== 'string') {
    return null
  }

  // 1. 全部小寫
  const lowercasedId = cardId.toLowerCase()

  const lastHyphenIndex = lowercasedId.lastIndexOf('-')
  // 如果格式不符（找不到分割點），直接返回 null 處理錯誤
  if (lastHyphenIndex === -1) {
    console.warn(`[useCardImage] Unexpected cardId format, cannot split: "${cardId}"`)
    return null
  }

  // 2. 拆分成兩部分
  const prefix = lowercasedId.substring(0, lastHyphenIndex) // "ab/w11"
  const suffix = lowercasedId.substring(lastHyphenIndex + 1) // "101td"

  // 3. 轉換第一部分
  const transformedPrefix = prefix.replace(/\//g, '-') // "ab-w11"

  return `${transformedPrefix}/${suffix}`
}

export function useCardImage(seriesId, cardId) {
  const imageUrl = computed(() => {
    // 確保 props 有效
    if (!seriesId.value || !cardId.value) {
      return '/placeholder.png' // 等待 props 時的預設圖
    }

    const imagePath = formatCardIdToPath(cardId.value)

    // 如果 ID 格式轉換失敗，返回一個特定的錯誤圖片，方便除錯
    if (!imagePath) {
      return '/image-format-error.png'
    }

    // 4. 合併最終路徑
    return `${imageBaseUrl}/${seriesId.value}/${imagePath}.webp`
  })

  return {
    imageUrl,
  }
}
