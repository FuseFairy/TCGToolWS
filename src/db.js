/* eslint-disable no-unused-vars */

import Dexie from 'dexie'

/**
 * 資料庫實例
 *
 * - 職責: 初始化 Dexie DB，定義 schema 與 hooks。
 * - 這是整個應用程式唯一的 DB 實例來源。
 */
export const db = new Dexie('CroppedImagesDB')

db.version(1).stores({
  // ++id: 自動遞增主鍵
  // cacheKey: 索引，用於快速查詢
  // lastAccessed: 索引，用於 LRU 清理
  images: '++id, cacheKey, lastAccessed',
  settings: '&key, value', // &key: 唯一主鍵
})

// Hook: 在建立資料時自動設定時間戳
db.images.hook('creating', (primKey, obj, trans) => {
  const now = Date.now()
  obj.timestamp = now
  obj.lastAccessed = now
})

db.images.hook('updating', (modifications, primKey, obj, trans) => {
  if (Object.keys(modifications).length === 0 || modifications.lastAccessed === undefined) {
    modifications.lastAccessed = Date.now()
  }
})
