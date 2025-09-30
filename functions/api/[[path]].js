import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'

import {
  handleSendVerificationCode,
  handleVerifyAndRegister,
  handleLogin,
  handleRefreshSession,
  handleForgotPasswordRequest,
  handleResetPassword,
} from '../../lib/auth.js'

const app = new Hono()

app.post('/api/register/send-code', handleSendVerificationCode)
app.post('/api/register/verify', handleVerifyAndRegister)
app.post('/api/login', handleLogin)
app.post('/api/session/refresh', handleRefreshSession)
app.post('/api/password/forgot', handleForgotPasswordRequest)
app.post('/api/password/reset', handleResetPassword)

export const onRequest = handle(app)
