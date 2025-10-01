import { Hono } from 'hono'
import {
  handleSendVerificationCode,
  handleVerifyAndRegister,
  handleLogin,
  handleRefreshSession,
  handleForgotPasswordRequest,
  handleResetPassword,
} from '../lib/auth.js'

const app = new Hono().basePath('/api')

app.post('/register/send-code', handleSendVerificationCode)
app.post('/register/verify', handleVerifyAndRegister)
app.post('/login', handleLogin)
app.post('/session/refresh', handleRefreshSession)
app.post('/password/forgot', handleForgotPasswordRequest)
app.post('/password/reset', handleResetPassword)

export default app
