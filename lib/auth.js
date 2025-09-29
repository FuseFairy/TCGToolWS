import { sign } from 'hono/jwt'
import { sendVerificationEmail } from '../services/brevo.js'

const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const hashPassword = async (password, salt) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return arrayBufferToHex(hashBuffer)
}

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export const handleSendVerificationCode = async (c) => {
  const db = c.env.DB
  const brevoApiKey = c.env.BREVO_API_KEY

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
      return c.json({ success: false, message: '此邮箱已被注册.' }, 409)
    }

    const verificationCode = generateVerificationCode()
    const expiresAt = Math.floor(Date.now() / 1000) + 600

    const salt = crypto.randomUUID()
    const hashedPassword = await hashPassword(password, salt)

    await db
      .prepare(
        'INSERT INTO pending_registrations (email, hashed_password, salt, verification_code, expires_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(email) DO UPDATE SET hashed_password=excluded.hashed_password, salt=excluded.salt, verification_code=excluded.verification_code, expires_at=excluded.expires_at'
      )
      .bind(email, hashedPassword, salt, verificationCode, expiresAt)
      .run()

    // 調用郵件服務
    await sendVerificationEmail(email, verificationCode, brevoApiKey)

    return c.json({ success: true, message: '验证码已发送至您的邮箱.' })
  } catch (error) {
    console.error('发送验证码时出错:', error)
    return c.json({ success: false, message: error.message || '服务器内部错误.' }, 500)
  }
}

export const handleVerifyAndRegister = async (c) => {
  const db = c.env.DB
  try {
    const { email, code } = await c.req.json()
    if (!email || !code) {
      return c.json({ success: false, message: '需要邮箱和验证码.' }, 400)
    }

    // 查找臨時註冊信息
    const pending = await db
      .prepare('SELECT * FROM pending_registrations WHERE email = ?1')
      .bind(email)
      .first()
    if (!pending) {
      return c.json({ success: false, message: '验证失败，请重新注册.' }, 400)
    }

    // 檢查驗證碼是否過期
    if (Math.floor(Date.now() / 1000) > pending.expires_at) {
      return c.json({ success: false, message: '验证码已过期，请重新注册.' }, 400)
    }

    // 檢查驗證碼是否正確
    if (pending.verification_code !== code) {
      return c.json({ success: false, message: '验证码错误.' }, 400)
    }

    // 驗證成功
    const id = crypto.randomUUID()
    await db
      .prepare(
        'INSERT INTO users (id, email, hashed_password, salt, last_login_time) VALUES (?1, ?2, ?3, ?4, ?5)'
      )
      .bind(id, pending.email, pending.hashed_password, pending.salt, Math.floor(Date.now() / 1000))
      .run()

    // 從臨時表中刪除記錄
    await db.prepare('DELETE FROM pending_registrations WHERE email = ?1').bind(email).run()

    return c.json({ success: true, message: '帐号注册成功！' }, 201)
  } catch (error) {
    console.error('验证并注册时出错:', error)
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
