import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CARD_DATA_DIR = path.join(__dirname, '../src/assets/card-data')
const OUTPUT_DIR = path.join(__dirname, '../public')
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'card-db-manifest.json')

console.log('🔍 Starting to build card index...')

// 讀取所有 JSON 檔案
const files = fs.readdirSync(CARD_DATA_DIR).filter((f) => f.endsWith('.json'))
console.log(`📁 Found ${files.length} card data files.`)

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

console.log(`     - Processed a total of ${cardCount} cards.`)

// 處理卡片連結（效果文字中提到的其他卡片）
console.log('     - Processing card links...')

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
    min: minPower === Infinity ? 0 : Math.floor(minPower / 500) * 500,
    max: maxPower === -Infinity ? 0 : maxPower,
  },
}

// 建立最終輸出
const output = {
  filterOptions,
  cards: allCards,
}

// 計算內容 hash
const content = JSON.stringify(output)
const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 8)
const version = `v${hash}`

// 加入版本號到輸出
output.version = version

console.log(`🔐 Content Hash: ${hash}`)

// 檢測內容變化，並判斷是否需要重新產生檔案
try {
  const nowManifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'))
  const currentVersion = nowManifest.version
  if (version == currentVersion) {
    console.log('⏭️ The content has not changed, skip the remaining steps...')
    process.exit(0)
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('⚒️ Manifest file not found, start creating files...')
  } else {
    throw error
  }
}

// 使用帶 hash 的檔名
const outputFileName = `all_cards_db.${hash}.bin`
const outputFilePath = path.join(OUTPUT_DIR, outputFileName)

// 寫入卡片資料檔案 (gzip 壓縮)
const gzippedContent = zlib.gzipSync(content)
fs.writeFileSync(outputFilePath, gzippedContent)
const fileSize = (fs.statSync(outputFilePath).size / 1024 / 1024).toFixed(2)

console.log(`💾 Index file created: ${outputFilePath}`)
console.log(`     - File size: ${fileSize} MB`)

// 建立 manifest 檔案
const manifest = {
  version,
  hash,
  fileName: outputFileName,
  fileSize: `${fileSize} MB`,
  cardCount,
  filterOptions: {
    productCount: filterOptions.productNames.length,
    traitCount: filterOptions.traits.length,
    rarityCount: filterOptions.rarities.length,
    costRange: filterOptions.costRange,
    powerRange: filterOptions.powerRange,
  },
}

fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
console.log(`     - Manifest file created: ${MANIFEST_FILE}`)

// 清理舊的帶 hash 的檔案
const oldFiles = fs
  .readdirSync(OUTPUT_DIR)
  .filter((f) => f.startsWith('all_cards_db.') && f.endsWith('.bin') && f !== outputFileName)

oldFiles.forEach((oldFile) => {
  const oldFilePath = path.join(OUTPUT_DIR, oldFile)
  fs.unlinkSync(oldFilePath)
  console.log(`     - Deleted old file: ${oldFile}`)
})

console.log('✨ Done!')