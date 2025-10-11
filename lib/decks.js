import { createErrorResponse } from './utils.js'

/**
 * Creates a new deck entry in the database.
 * @param {object} c - Hono context object.
 * @returns {Response}
 */
export async function handleCreateDeck(c) {
  try {
    const { key, deckData } = await c.req.json()

    if (!key || !deckData) {
      return createErrorResponse(c, 400, '缺少 key 或 deckData')
    }

    const user = c.get('user')

    // 檢查用戶現有的牌組數量
    const { count } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM decks WHERE user_id = ?'
    )
      .bind(user.id)
      .first()

    const MAX_DECKS_PER_USER = 10
    if (count >= MAX_DECKS_PER_USER) {
      return createErrorResponse(c, 403, `最多只能储存 ${MAX_DECKS_PER_USER} 副卡组`)
    }

    const deckDataArray = new Uint8Array(Object.values(deckData))

    const info = await c.env.DB.prepare(
      `INSERT INTO decks (key, user_id, deck_data)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
       deck_data = excluded.deck_data`
    )
      .bind(key, user.id, deckDataArray)
      .run()

    if (!info.success) {
      return createErrorResponse(c, 500, '数据库操作失败')
    }
    return c.json({ success: true }, 201)
  } catch (error) {
    console.error('Error creating deck:', error)
    return createErrorResponse(c, 500, '内部服务器错误')
  }
}

/**
 * Retrieves all decks for the authenticated user.
 * @param {object} c - Hono context object.
 * @returns {Response}
 */
export async function handleGetDecks(c) {
  try {
    const user = c.get('user')

    const { results } = await c.env.DB.prepare('SELECT key, deck_data FROM decks WHERE user_id = ?')
      .bind(user.id)
      .all()

    return c.json(results)
  } catch (error) {
    console.error('Error fetching decks:', error)
    return createErrorResponse(c, 500, '内部服务器错误')
  }
}

/**
 * Retrieves a specific deck by its key for the authenticated user.
 * @param {object} c - Hono context object.
 * @returns {Response}
 */
export async function handleGetDeckByKey(c) {
  try {
    const { key } = c.req.param()

    const result = await c.env.DB.prepare('SELECT key, deck_data FROM decks WHERE key = ?')
      .bind(key)
      .first()

    if (!result) {
      return createErrorResponse(c, 404, '卡组不存在')
    }

    return c.json(result)
  } catch (error) {
    console.error('Error fetching deck:', error)
    return createErrorResponse(c, 500, '内部服务器错误')
  }
}

/**
 * Deletes a deck entry from the database.
 * @param {object} c - Hono context object.
 * @returns {Response}
 */
export async function handleDeleteDeck(c) {
  try {
    const user = c.get('user')
    const { key } = c.req.param()

    if (!key) {
      return createErrorResponse(c, 400, '缺少必要参数 key')
    }

    const info = await c.env.DB.prepare('DELETE FROM decks WHERE user_id = ? AND key = ?')
      .bind(user.id, key)
      .run()

    if (!info.success) {
      console.error('D1 Delete failed:', info.error)
      return createErrorResponse(c, 500, '数据库操作失败')
    }

    if (info.changes === 0) {
      return createErrorResponse(c, 404, '卡组未找到或无权限删除')
    }

    return c.json({ success: true }, 200)
  } catch (error) {
    console.error('Error deleting deck:', error)
    return createErrorResponse(c, 500, '内部服务器错误')
  }
}

/**
 * Updates an existing deck entry in the database.
 * @param {object} c - Hono context object.
 * @returns {Response}
 */
export async function handleUpdateDeck(c) {
  try {
    const { key } = c.req.param()
    const { deckData } = await c.req.json()

    if (!key || !deckData) {
      return createErrorResponse(c, 400, '缺少 key 或 deckData')
    }

    const user = c.get('user')
    const deckDataArray = new Uint8Array(Object.values(deckData))

    const info = await c.env.DB.prepare(
      `UPDATE decks SET deck_data = ? WHERE key = ? AND user_id = ?`
    )
      .bind(deckDataArray, key, user.id)
      .run()

    if (!info.success) {
      return createErrorResponse(c, 500, '数据库操作失败')
    }

    if (info.changes === 0) {
      return createErrorResponse(c, 404, '卡组未找到或无权限更新')
    }

    return c.json({ success: true }, 200)
  } catch (error) {
    console.error('Error updating deck:', error)
    return createErrorResponse(c, 500, '内部服务器错误')
  }
}
