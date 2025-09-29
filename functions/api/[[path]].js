import { Hono } from 'hono'
import { handleSendVerificationCode, handleVerifyAndRegister, handleLogin } from '../../lib/auth.js'

const app = new Hono()

app.post('/api/register/send-code', handleSendVerificationCode)
app.post('/api/register/verify', handleVerifyAndRegister)
app.post('/api/login', handleLogin)

export const onRequest = (context) => app.fetch(context.request, context.env, context)
