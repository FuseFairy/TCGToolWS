/**
 * Creates a new deck entry in the database.
 * @param {object} c - Hono context object.
 * @returns {Response}
 */
export async function handleCreateDeck(c) {
  try {
    const { key, deckData } = await c.req.json()
    const user = c.get('user')

    // 檢查用戶現有的牌組數量
    const { count } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM decks WHERE user_id = ?'
    )
      .bind(user.id)
      .first()

    const MAX_DECKS_PER_USER = 10
    if (count >= MAX_DECKS_PER_USER) {
      return c.json({ error: `最多只能储存 ${MAX_DECKS_PER_USER} 副牌组` }, 403)
    }

    if (!key || !deckData) {
      return c.json({ error: 'Missing key or deckData' }, 400)
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
      console.error('D1 Insert/Update failed:', info.error)
      return c.json({ error: 'Database operation failed' }, 500)
    }
    return c.json({ success: true }, 201)
  } catch (error) {
    console.error('Error creating deck:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
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
    return c.json({ error: 'Internal Server Error' }, 500)
  }
}

/**
 * Retrieves a specific deck by its key for the authenticated user.
 * @param {object} c - Hono context object.
 * @returns {Response}
 */
export async function handleGetDeckByKey(c) {
  try {
    const user = c.get('user')
    const { key } = c.req.param()

    const result = await c.env.DB.prepare(
      'SELECT key, deck_data FROM decks WHERE user_id = ? AND key = ?'
    )
      .bind(user.id, key)
      .first()

    if (!result) {
      return c.json({ error: 'Deck not found' }, 404)
    }

    return c.json(result)
  } catch (error) {
    console.error('Error fetching deck by key:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
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

    const info = await c.env.DB.prepare('DELETE FROM decks WHERE user_id = ? AND key = ?')
      .bind(user.id, key)
      .run()

    if (!info.success) {
      console.error('D1 Delete failed:', info.error)
      return c.json({ error: 'Database operation failed' }, 500)
    }
    if (info.changes === 0) {
      return c.json({ error: 'Deck not found or not authorized' }, 404)
    }
    return c.json({ success: true }, 200)
  } catch (error) {
    console.error('Error deleting deck:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
}
