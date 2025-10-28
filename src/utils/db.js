/**
 * Opens an IndexedDB database and ensures an object store exists.
 * @param {string} dbName - The name of the database.
 * @param {string} storeName - The name of the object store.
 * @param {string} [keyPath='key'] - The key path for the object store.
 * @param {number} [version=1] - The database version.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
export const openDB = (dbName, storeName, keyPath = 'key', version = 1) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version)
    request.onerror = () => reject(new Error(`❌ Failed to open IndexedDB: ${dbName}`))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath })
      }
    }
  })
}

/**
 * Saves data to a specific object store in an IndexedDB database.
 * @param {IDBDatabase} db - The database instance.
 * @param {string} storeName - The name of the object store.
 * @param {object} data - The data to save.
 * @returns {Promise<any>} A promise that resolves with the result of the put operation.
 */
export const saveData = (db, storeName, data) => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)
      request.onerror = () => reject(new Error(`❌ Failed to save data to ${storeName}`))
      request.onsuccess = () => resolve(request.result)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Loads data from a specific object store in an IndexedDB database.
 * @param {IDBDatabase} db - The database instance.
 * @param {string} storeName - The name of the object store.
 * @param {any} key - The key of the data to load.
 * @returns {Promise<any>} A promise that resolves with the loaded data.
 */
export const loadData = (db, storeName, key) => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)
      request.onerror = () => reject(new Error(`❌ Failed to load data from ${storeName}`))
      request.onsuccess = () => resolve(request.result)
    } catch (error) {
      reject(error)
    }
  })
}
