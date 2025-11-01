import { ref, watchEffect } from 'vue'
import ColorThief from 'colorthief'

// 簡易的 RGB-HSL 轉換函式
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0 // 無色
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r, g, b
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ]
}

// 判斷色差（簡易 Hue 差距過濾）
function isDistinctColor(h1, h2, threshold = 15) {
  return Math.abs(h1 - h2) > threshold
}

export function useColorExtractor(imageUrl) {
  const colors = ref([])

  watchEffect((onCleanup) => {
    colors.value = []
    if (!imageUrl.value) return

    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl.value

    let isCanceled = false
    onCleanup(() => { isCanceled = true })

    img.onload = () => {
      if (isCanceled) return

      try {
        const colorThief = new ColorThief()
        let palette = colorThief.getPalette(img, 12) // 抽多一點再篩

        // 調整與篩選
        let processed = []
        for (const rgb of palette) {
          let [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])
          s = Math.min(Math.max(s, 25), 55) // 彩度介於 25~55%
          l = Math.min(Math.max(l, 35), 70) // 亮度適中
          const newRgb = hslToRgb(h, s, l)

          // 過濾相似色
          if (processed.every(c => isDistinctColor(c.h, h))) {
            processed.push({ rgb: newRgb, h })
          }
        }

        // 限制最多 7 色
        processed = processed.slice(0, 7)
        colors.value = processed.map(c => `rgb(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]})`)
      } catch (error) {
        console.error('Color extraction failed:', error)
        colors.value = ['#8CA0A0', '#A7B8B8', '#C1C9C9', '#DADFE0', '#ECEFF0', '#F5F7F7']
      }
    }

    img.onerror = (error) => {
      if (isCanceled) return
      console.error('Error loading image:', error)
      colors.value = ['#8CA0A0', '#A7B8B8', '#C1C9C9', '#DADFE0', '#ECEFF0', '#F5F7F7']
    }
  })

  return { colors }
}
