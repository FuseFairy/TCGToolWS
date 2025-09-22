// src/services/ImageCache.js

import { db } from '../db'

const CACHE_CONFIG = {
  maxEntries: 500,
  maxSizeMB: 100,
  maxAgeDays: 14,
  cleanupIntervalMs: 30 * 60 * 1000,
  memoryTTL: 5 * 60 * 1000,
}

// 混合圖片快取服務 (IndexedDB + Memory)
class HybridImageCache {
  constructor() {
    // { key: { url, timestamp, refCount } }
    this.memoryCache = new Map()
    this._initPromise = null

    // 頁面卸載時自動清理所有記憶體快取
    window.addEventListener('beforeunload', () => this._cleanupMemoryCacheOnUnload())
  }

  // --- Public API ---

  //  取得或生成圖片 Blob URL。
  async getOrGenerate(sourceUrl, coords, generatorFn) {
    await this._ensureInitialized()
    const cacheKey = this._generateCacheKey(sourceUrl, coords)

    // 1. 檢查記憶體快取
    const memoryResult = this._getMemoryCache(cacheKey)
    if (memoryResult) {
      console.log(`[Cache] Memory hit: ${cacheKey}`)
      return memoryResult
    }

    // 2. 檢查 IndexedDB
    const dbResult = await this._getFromDB(cacheKey)
    if (dbResult) {
      console.log(`[Cache] DB hit: ${cacheKey}`)
      this._setMemoryCache(cacheKey, dbResult)
      return dbResult
    }

    // 3. 快取未命中，執行生成器
    console.log(`[Cache] Miss. Processing: ${cacheKey}`)
    const blob = await generatorFn()

    // 4. 存入快取 (DB + Memory)
    return this._set(cacheKey, sourceUrl, coords, blob)
  }

  /**
   * 通知服務，某個 Blob URL 不再被使用。
   * 服務內部會根據引用計數決定是否從記憶體中釋放。
   * @param {string} blobUrl - 由 getOrGenerate 回傳的 Blob URL
   */
  release(blobUrl) {
    if (!blobUrl || !blobUrl.startsWith('blob:')) return

    // 透過 URL 反向查找 cacheKey
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.url === blobUrl) {
        this._removeMemoryCache(key)
        break
      }
    }
  }

  // --- 內部實現 (Private Methods) ---

  _ensureInitialized() {
    if (!this._initPromise) {
      this._initPromise = this._initialize()
    }
    return this._initPromise
  }

  async _initialize() {
    try {
      await db.open()
      setInterval(() => this._backgroundCleanup(), CACHE_CONFIG.cleanupIntervalMs)
      console.log('Image cache initialized')
    } catch (error) {
      console.error('Failed to initialize image cache:', error)
      // 如果初始化失敗，後續操作會持續失敗，這是可預期的
    }
  }

  _generateCacheKey(sourceUrl, coords) {
    const fileName = sourceUrl
      .split('/')
      .pop()
      .replace(/\.[^/.]+$/, '')

    const coordsStr = `${coords.x}_${coords.y}_${coords.width}_${coords.height}`
    return `${fileName}_${coordsStr}`
  }

  // --- 記憶體快取管理 (完全內聚) ---

  _setMemoryCache(key, url) {
    this._cleanExpiredMemoryCache()
    const existing = this.memoryCache.get(key)
    if (existing) {
      existing.refCount++
      existing.timestamp = Date.now()
    } else {
      this.memoryCache.set(key, { url, timestamp: Date.now(), refCount: 1 })
    }
  }

  _getMemoryCache(key) {
    const cached = this.memoryCache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > CACHE_CONFIG.memoryTTL) {
      this._removeMemoryCache(key) // 過期則移除
      return null
    }

    cached.refCount++ // 每次成功獲取，引用計數+1
    cached.timestamp = Date.now()
    return cached.url
  }

  _removeMemoryCache(key) {
    const cached = this.memoryCache.get(key)
    if (cached) {
      cached.refCount--
      if (cached.refCount <= 0) {
        URL.revokeObjectURL(cached.url)
        this.memoryCache.delete(key)
      }
    }
  }

  _cleanExpiredMemoryCache() {
    const now = Date.now()
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now - cached.timestamp > CACHE_CONFIG.memoryTTL && cached.refCount <= 0) {
        this._removeMemoryCache(key)
      }
    }
  }

  _cleanupMemoryCacheOnUnload() {
    for (const cached of this.memoryCache.values()) {
      URL.revokeObjectURL(cached.url)
    }
    this.memoryCache.clear()
  }

  // --- DB 快取管理 ---
  async _getFromDB(cacheKey) {
    try {
      const cached = await db.images.where('cacheKey').equals(cacheKey).first()
      if (!cached) return null

      // 檢查是否過期
      const age = Date.now() - cached.timestamp
      if (age > CACHE_CONFIG.maxAgeDays * 24 * 60 * 60 * 1000) {
        await db.images.delete(cached.id)
        return null
      }

      await db.images.update(cached.id, {}) // 觸發 hook 更新 lastAccessed
      return URL.createObjectURL(cached.blob)
    } catch (error) {
      console.error('Failed to read from IndexedDB cache:', error)
      return null
    }
  }

  async _set(cacheKey, sourceUrl, coords, blob) {
    const blobUrl = URL.createObjectURL(blob)
    try {
      await db.images.put({
        cacheKey,
        blob,
        sourceUrl,
        coords: { ...coords },
        fileSize: blob.size,
      })

      this._setMemoryCache(cacheKey, blobUrl)

      // 非同步執行清理，不阻塞主流程
      setTimeout(() => this._enforceCacheLimits(), 100)

      console.log(`[Cache] Saved: ${cacheKey} (${(blob.size / 1024).toFixed(1)}KB)`)
      return blobUrl
    } catch (error) {
      console.error('Failed to save to cache:', error)
      // 即使DB儲存失敗，也回傳記憶體中的 Blob URL，確保UI能顯示
      this._setMemoryCache(cacheKey, blobUrl)
      return blobUrl
    }
  }

  // --- 清理機制 ---
  async _enforceCacheLimits() {
    try {
      const stats = await this.getStats()

      // 檢查數量限制
      if (stats.count > CACHE_CONFIG.maxEntries) {
        await this._cleanupByLRU(stats.count - CACHE_CONFIG.maxEntries) // ✅ 修正
      }

      // 檢查大小限制
      if (stats.totalSizeMB > CACHE_CONFIG.maxSizeMB) {
        const targetSizeMB = CACHE_CONFIG.maxSizeMB * 0.8
        await this._cleanupBySize(targetSizeMB) // ✅ 修正
      }
    } catch (error) {
      console.error('Cache cleanup failed:', error)
    }
  }

  async _cleanupByLRU(count) {
    const oldestItems = await db.images.orderBy('lastAccessed').limit(count).toArray()

    const idsToDelete = oldestItems.map((item) => item.id)
    await db.images.bulkDelete(idsToDelete)

    // 清理對應的記憶體快取 ✅ 修正方法名
    oldestItems.forEach((item) => this._removeMemoryCache(item.cacheKey))

    console.log(`Cleaned up ${count} oldest cache entries`)
  }

  async _cleanupBySize(targetSizeMB) {
    const targetSizeBytes = targetSizeMB * 1024 * 1024
    let currentSize = 0

    // 按存取時間排序，保留最近使用的
    const items = await db.images.orderBy('lastAccessed').reverse().toArray()

    const idsToKeep = []
    for (const item of items) {
      if (currentSize + item.fileSize <= targetSizeBytes) {
        idsToKeep.push(item.id)
        currentSize += item.fileSize
      }
    }

    // 刪除不在保留清單中的項目
    const deletedCount = await db.images.where('id').noneOf(idsToKeep).delete()

    console.log(`Size cleanup: kept ${idsToKeep.length} items, removed ${deletedCount} items`)
  }

  async _backgroundCleanup() {
    try {
      // 清理過期項目
      const cutoffTime = Date.now() - CACHE_CONFIG.maxAgeDays * 24 * 60 * 60 * 1000
      const deletedCount = await db.images.where('timestamp').below(cutoffTime).delete()

      if (deletedCount > 0) {
        console.log(`Background cleanup: removed ${deletedCount} expired items`)
      }

      // 清理記憶體快取 ✅ 修正方法名
      this._cleanExpiredMemoryCache()

      // 強制執行快取限制 ✅ 修正方法名
      await this._enforceCacheLimits()
    } catch (error) {
      console.error('Background cleanup failed:', error)
    }
  }

  // --- 統計與管理工具 ---
  async getStats() {
    const count = await db.images.count()
    const items = await db.images.toArray()
    const totalSize = items.reduce((sum, item) => sum + (item.fileSize || 0), 0)

    return {
      count,
      totalSizeBytes: totalSize,
      totalSizeMB: +(totalSize / 1024 / 1024).toFixed(2),
      memoryCache: {
        entries: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys()),
      },
    }
  }

  async clear() {
    this._cleanupMemoryCacheOnUnload() // ✅ 修正方法名
    await db.images.clear()
    console.log('All caches cleared')
  }
}

export const imageCache = new HybridImageCache()
