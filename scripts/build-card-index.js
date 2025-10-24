import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CARD_DATA_DIR = path.join(__dirname, '../src/assets/card-data')
const OUTPUT_FILE = path.join(__dirname, '../public/all_cards_db.json')

console.log('🔍 開始建立卡片索引...')

// 讀取所有 JSON 檔案
const files = fs.readdirSync(CARD_DATA_DIR).filter((f) => f.endsWith('.json'))
console.log(`📁 找到 ${files.length} 個卡片資料檔案`)

const allCards = []
let cardCount = 0

const productNamesSet = new Set()
const traitsSet = new Set()
const raritiesSet = new Set()
let minCost = Infinity,
  maxCost = -Infinity,
  minPower = Infinity,
  maxPower = -Infinity

files.forEach((filename) => {
  const filePath = path.join(CARD_DATA_DIR, filename)
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const cardIdPrefix = filename.replace('.json', '')

  // 轉換資料結構：從 { "ID": {...} } 變成陣列
  for (const baseId in content) {
    const cardData = content[baseId]

    // 收集篩選選項
    if (cardData.product_name) productNamesSet.add(cardData.product_name)
    if (cardData.trait && Array.isArray(cardData.trait)) {
      cardData.trait.forEach((t) => traitsSet.add(t))
    }
    if (typeof cardData.cost === 'number') {
      minCost = Math.min(minCost, cardData.cost)
      maxCost = Math.max(maxCost, cardData.cost)
    }
    if (typeof cardData.power === 'number') {
      minPower = Math.min(minPower, cardData.power)
      maxPower = Math.max(maxPower, cardData.power)
    }

    const { all_cards, ...baseCardData } = cardData

    if (all_cards && Array.isArray(all_cards)) {
      all_cards.forEach((cardVersion) => {
        if (cardVersion.rarity) raritiesSet.add(cardVersion.rarity)
        allCards.push({
          ...baseCardData,
          ...cardVersion,
          baseId,
          cardIdPrefix,
        })
        cardCount++
      })
    }
  }
})

console.log(`✅ 共處理 ${cardCount} 張卡片`)

// 處理卡片連結（效果文字中提到的其他卡片）
console.log('🔗 處理卡片連結...')

allCards.forEach((card) => (card.link = []))

const nameToCardBaseIds = new Map()
const baseIdToCardsMap = new Map()

for (const card of allCards) {
  if (!nameToCardBaseIds.has(card.name)) {
    nameToCardBaseIds.set(card.name, new Set())
  }
  nameToCardBaseIds.get(card.name).add(card.baseId)

  if (!baseIdToCardsMap.has(card.baseId)) {
    baseIdToCardsMap.set(card.baseId, [])
  }
  baseIdToCardsMap.get(card.baseId).push(card)
}

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const allNamesPattern = [...nameToCardBaseIds.keys()].map(escapeRegex).join('|')
const nameMatcherRegex = new RegExp(`「(${allNamesPattern})」`, 'g')

for (const targetCard of allCards) {
  const effectText = targetCard.effect || ''
  if (!effectText) continue

  const matches = effectText.matchAll(nameMatcherRegex)

  for (const match of matches) {
    const foundName = match[1]
    const sourceBaseIds = nameToCardBaseIds.get(foundName)

    if (sourceBaseIds) {
      for (const sourceBaseId of sourceBaseIds) {
        if (!targetCard.link.includes(sourceBaseId)) {
          targetCard.link.push(sourceBaseId)
        }
        const sourceCardsToUpdate = baseIdToCardsMap.get(sourceBaseId)
        if (sourceCardsToUpdate) {
          for (const sourceCard of sourceCardsToUpdate) {
            if (!sourceCard.link.includes(targetCard.baseId)) {
              sourceCard.link.push(targetCard.baseId)
            }
          }
        }
      }
    }
  }
}

const baseIdToFullIdsMap = new Map()
for (const card of allCards) {
  if (!baseIdToFullIdsMap.has(card.baseId)) {
    baseIdToFullIdsMap.set(card.baseId, [])
  }
  baseIdToFullIdsMap.get(card.baseId).push(card.id)
}

for (const card of allCards) {
  if (card.link && Array.isArray(card.link) && card.link.length > 0) {
    card.link = card.link.flatMap((linkBaseId) => baseIdToFullIdsMap.get(linkBaseId) || [])
  }
}

// 建立篩選選項
const filterOptions = {
  productNames: [...productNamesSet],
  traits: [...traitsSet],
  rarities: [...raritiesSet].sort(),
  costRange: {
    min: minCost === Infinity ? 0 : minCost,
    max: maxCost === -Infinity ? 0 : maxCost,
  },
  powerRange: {
    min: minPower === Infinity ? 0 : minPower,
    max: maxPower === -Infinity ? 0 : maxPower,
  },
}

// 建立最終輸出
const output = {
  version: 'v1.0.0',
  timestamp: new Date().toISOString(),
  filterOptions,
  cards: allCards,
}

// 確保 public 資料夾存在
const publicDir = path.dirname(OUTPUT_FILE)
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// 寫入檔案
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output))
const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)
console.log(`💾 索引檔案已建立: ${OUTPUT_FILE}`)
console.log(`📊 檔案大小: ${fileSize} MB`)
console.log(`📋 篩選選項:`)
console.log(`   - 產品: ${filterOptions.productNames.length} 個`)
console.log(`   - 特性: ${filterOptions.traits.length} 個`)
console.log(`   - 稀有度: ${filterOptions.rarities.length} 個`)
console.log(`   - 費用範圍: ${filterOptions.costRange.min} - ${filterOptions.costRange.max}`)
console.log(`   - 戰力範圍: ${filterOptions.powerRange.min} - ${filterOptions.powerRange.max}`)
console.log('✨ 完成！')