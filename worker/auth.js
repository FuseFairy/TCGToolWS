import { sign } from 'hono/jwt'

const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return arrayBufferToHex(hashBuffer)
}

export const handleRegister = async (c) => {
  const db = c.env.DB
  try {
    const { email, password } = await c.req.json()
    if (!email || !password || password.length < 8) {
      return c.json({ success: false, message: '无效的输入.' }, 400)
    }

    const existingUser = await db
      .prepare('SELECT id FROM users WHERE email = ?1')
      .bind(email)
      .first()
    if (existingUser) {
      return c.json({ success: false, message: '邮箱已被注册.' }, 409)
    }

    const id = crypto.randomUUID()
    const salt = crypto.randomUUID()
    const hashedPassword = await hashPassword(password, salt)

    await db
      .prepare(
        'INSERT INTO users (id, email, hashed_password, salt, last_login_time) VALUES (?1, ?2, ?3, ?4, ?5)'
      )
      .bind(id, email, hashedPassword, salt, Math.floor(Date.now() / 1000))
      .run()

    return c.json({ success: true, message: '用户注册成功.', userId: id }, 201)
  } catch (error) {
    console.error('注册时发生错误:', error)
    return c.json({ success: false, message: '服务器内部错误.' }, 500)
  }
}

export const handleLogin = async (c) => {
  const db = c.env.DB
  const secret = c.env.JWT_SECRET

  try {
    const { email, password } = await c.req.json()
    if (!email || !password) {
      return c.json({ success: false, message: '需要邮箱和密码.' }, 400)
    }

    const user = await db
      .prepare('SELECT id, hashed_password, salt FROM users WHERE email = ?1')
      .bind(email)
      .first()
    if (!user) {
      return c.json({ success: false, message: '无效的邮箱或密码.' }, 401)
    }

    const hashedPasswordAttempt = await hashPassword(password, user.salt)
    if (hashedPasswordAttempt !== user.hashed_password) {
      return c.json({ success: false, message: '无效的邮箱或密码.' }, 401)
    }

    const currentTime = Math.floor(Date.now() / 1000)
    await db
      .prepare('UPDATE users SET last_login_time = ?1 WHERE id = ?2')
      .bind(currentTime, user.id)
      .run()

    const payload = {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }
    const token = await sign(payload, secret)

    return c.json({ success: true, message: '登录成功.', token: token })
  } catch (error) {
    console.error('登录时发生错误:', error)
    return c.json({ success: false, message: '服务器内部错误.' }, 500)
  }
}
