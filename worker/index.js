import { Hono } from 'hono'
import { handleRegister, handleLogin } from './auth.js'

const app = new Hono()

app.post('/api/register', handleRegister)
app.post('/api/login', handleLogin)

export default {
  fetch: app.fetch,
}
