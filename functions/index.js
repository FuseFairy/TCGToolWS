import { Hono } from 'hono'
import {
  handleSendVerificationCode,
  handleVerifyAndRegister,
  handleLogin,
  handleRefreshSession,
  handleForgotPasswordRequest,
  handleResetPassword,
  authMiddleware,
} from '../lib/auth.js'
import {
  handleCreateDeck,
  handleGetDecks,
  handleGetDeckByKey,
  handleDeleteDeck,
  handleUpdateDeck,
} from '../lib/decks.js'

const app = new Hono().basePath('/api')

// === 公開的 Auth 路由 ===
const authRoutes = new Hono()
authRoutes.post('/register/send-code', handleSendVerificationCode)
authRoutes.post('/register/verify', handleVerifyAndRegister)
authRoutes.post('/login', handleLogin)
authRoutes.post('/session/refresh', handleRefreshSession)
authRoutes.post('/password/forgot', handleForgotPasswordRequest)
authRoutes.post('/password/reset', handleResetPassword)

// === 受保護的 Deck 路由 ===
const deckRoutes = new Hono()
deckRoutes.use('/*', authMiddleware)
deckRoutes.post('/', handleCreateDeck)
deckRoutes.put('/:key', handleUpdateDeck)
deckRoutes.get('/', handleGetDecks)
deckRoutes.delete('/:key', handleDeleteDeck)

// === 公開的 Deck 路由 ===
const publicDeckRoutes = new Hono()
publicDeckRoutes.get('/:key', handleGetDeckByKey)

// === 組合所有路由 ===
app.route('/', authRoutes)
app.route('/decks', deckRoutes)
app.route('/shared-decks', publicDeckRoutes)

export default app
