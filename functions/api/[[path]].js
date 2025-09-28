import { Hono } from 'hono'
import { handleRegister, handleLogin } from '../lib/auth.js'

const app = new Hono()

app.post('/api/register', handleRegister)
app.post('/api/login', handleLogin)

export const onRequest = (context) => app.fetch(context.request, context.env, context)
