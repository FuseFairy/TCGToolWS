import fs from 'fs/promises'
import path from 'path'
import process from 'process'
import { glob } from 'glob'
import Spritesmith from 'spritesmith'
import sharp from 'sharp'
import Vinyl from 'vinyl'

// --- Configuration---
const SOURCE_DIR = path.resolve(process.cwd(), 'assets-source/card-images')
const OUTPUT_DIR = path.resolve(process.cwd(), 'assets-source/spritesheets')
const WEBP_QUALITY = 80

/**
 * Pre-processes images: reads, checks orientation, and rotates if necessary.
 * @param {string[]} filepaths - Array of image file paths.
 * @returns {Promise<Vinyl[]>} - A promise that resolves to an array of Vinyl objects.
 */
async function preprocessImages(filepaths) {
  const vinylPromises = filepaths.map(async (filepath) => {
    const image = sharp(filepath)
    const metadata = await image.metadata()

    let imageBuffer
    // If width is greater than height, it's a landscape card; rotate it clockwise.
    if (metadata.width > metadata.height) {
      imageBuffer = await image.rotate(90).toBuffer()
    } else {
      imageBuffer = await image.toBuffer()
    }

    // Create a Vinyl object.
    return new Vinyl({
      path: filepath,
      contents: imageBuffer,
    })
  })
  return Promise.all(vinylPromises)
}

/**
 * Formats the coordinate map keys to the required 'SERIES/PROD-NUMRARITY' format.
 * @param {Object} coordinates - The raw coordinates object from Spritesmith.
 * @returns {Object} - The formatted coordinates object.
 */
function formatCoordinates(coordinates) {
  const formatted = {}
  for (const [filepath, coords] of Object.entries(coordinates)) {
    const dirName = path.basename(path.dirname(filepath))
    const fileName = path.basename(filepath, '.png')

    const [series, productNum] = dirName.split('-')

    // 抓取 "001" 或 "t07"
    const cardNumAndPrefixMatch = fileName.match(/^[a-zA-Z]*\d+/)
    const rarityMatch = fileName.match(/[a-zA-Z]+$/)

    if (!series || !productNum || !cardNumAndPrefixMatch || !rarityMatch) {
      console.warn(`[WARN] Skipping coordinate formatting for invalid path: ${filepath}`)
      continue
    }

    const CardNumPart = cardNumAndPrefixMatch[0] // 可能是 "001" 或 "t07"
    const rarity = rarityMatch[0]

    const finalKey = `${series}/${productNum}-${CardNumPart}${rarity}`.toUpperCase()
    formatted[finalKey] = coords
  }
  return formatted
}

/**
 * The main build function.
 */
async function buildAllSprites() {
  console.log('🚀 Starting spritesheet generation...')
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const productDirs = await fs.readdir(SOURCE_DIR, { withFileTypes: true })

  for (const dirent of productDirs) {
    if (!dirent.isDirectory()) continue

    const productId = dirent.name
    const productPath = path.join(SOURCE_DIR, productId)
    console.log(`\n🔍 Processing product: ${productId}`)

    const files = await glob(`${productPath}/*.png`)
    if (files.length === 0) {
      console.log('🟡 No images found, skipping.')
      continue
    }

    // Handle single-image folders as a special case.
    if (files.length === 1) {
      console.log('🖼️ Found a single image, converting directly...')
      const imagePath = files[0]
      const image = sharp(imagePath)
      const metadata = await image.metadata()
      const finalImage = metadata.width > metadata.height ? image.rotate(90) : image

      const outputPath = path.join(OUTPUT_DIR, `${productId}.webp`)
      await finalImage.webp({ quality: WEBP_QUALITY }).toFile(outputPath)

      const finalMeta = await finalImage.metadata()
      const coords = {
        [imagePath]: { x: 0, y: 0, width: finalMeta.width, height: finalMeta.height },
      }
      const formattedCoords = formatCoordinates(coords)

      const mapPath = path.join(OUTPUT_DIR, `${productId}.json`)
      await fs.writeFile(mapPath, JSON.stringify(formattedCoords, null, 2))

      console.log(`✅ ${productId} processed successfully.`)
      continue
    }

    console.log(`🖼️ Found ${files.length} images, pre-processing...`)
    const vinylFiles = await preprocessImages(files)

    console.log('🧩 Running Spritesmith layout algorithm...')
    const result = await new Promise((resolve, reject) => {
      Spritesmith.run(
        {
          src: vinylFiles,
          padding: 2,
        },
        (err, result) => {
          if (err) return reject(err)
          resolve(result)
        },
      )
    })

    console.log('🎨 Converting spritesheet to WebP format...')
    const outputPath = path.join(OUTPUT_DIR, `${productId}.webp`)
    await sharp(result.image).webp({ quality: WEBP_QUALITY }).toFile(outputPath)

    console.log('🗺️ Formatting coordinate map...')
    const finalCoordinates = formatCoordinates(result.coordinates)

    const mapPath = path.join(OUTPUT_DIR, `${productId}.json`)
    await fs.writeFile(mapPath, JSON.stringify(finalCoordinates, null, 2))

    console.log(`✅ ${productId} processed successfully.`)
  }

  console.log('\n🎉 All product spritesheets have been generated!')
}

buildAllSprites()
