import { sign, verify } from 'hono/jwt'
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/brevo.js'
import { createErrorResponse } from './utils.js'

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
    if (!email) {
      return createErrorResponse(c, 400, '请提供邮箱地址')
    }
    if (!password) {
      return createErrorResponse(c, 400, '请提供密码')
    }
    if (password.length < 8) {
      return createErrorResponse(c, 400, '密码长度不能少于8位')
    }

    const existingUser = await db
      .prepare('SELECT id FROM users WHERE email = ?1')
      .bind(email)
      .first()
    if (existingUser) {
      return createErrorResponse(c, 409, '此邮箱已被注册')
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

    return c.json({ success: true, message: '验证码已发送至您的邮箱' })
  } catch (error) {
    console.error('发送验证码时出错:', error)
    return createErrorResponse(c, 500, error.message || '服务器内部错误')
  }
}

export const handleVerifyAndRegister = async (c) => {
  const db = c.env.DB
  try {
    const { email, code } = await c.req.json()
    if (!email || !code) {
      return createErrorResponse(c, 400, '需要邮箱和验证码')
    }

    // 查找臨時註冊信息
    const pending = await db
      .prepare('SELECT * FROM pending_registrations WHERE email = ?1')
      .bind(email)
      .first()
    if (!pending) {
      return createErrorResponse(c, 400, '验证失败，请重新注册')
    }

    // 檢查驗證碼是否過期
    if (Math.floor(Date.now() / 1000) > pending.expires_at) {
      return createErrorResponse(c, 400, '验证码已过期，请重新注册')
    }

    // 檢查驗證碼是否正確
    if (pending.verification_code !== code) {
      return createErrorResponse(c, 400, '验证码错误')
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
    return createErrorResponse(c, 500, '服务器内部错误')
  }
}

export const handleLogin = async (c) => {
  const db = c.env.DB
  const secret = c.env.JWT_SECRET

  try {
    const { email, password } = await c.req.json()
    if (!email || !password) {
      return createErrorResponse(c, 400, '需要邮箱和密码')
    }

    const user = await db
      .prepare('SELECT id, hashed_password, salt FROM users WHERE email = ?1')
      .bind(email)
      .first()
    if (!user) {
      return createErrorResponse(c, 401, '无效的邮箱或密码')
    }

    const hashedPasswordAttempt = await hashPassword(password, user.salt)
    if (hashedPasswordAttempt !== user.hashed_password) {
      return createErrorResponse(c, 401, '无效的邮箱或密码')
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

    return c.json({ success: true, message: '登录成功', token: token })
  } catch (error) {
    console.error('登录时发生错误:', error)
    return createErrorResponse(c, 500, '服务器内部错误')
  }
}

export const handleRefreshSession = async (c) => {
  const db = c.env.DB
  const secret = c.env.JWT_SECRET

  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(c, 401, '身份验证失败')
    }
    const token = authHeader.substring(7)

    const payload = await verify(token, secret)

    const userId = payload.sub
    const user = await db.prepare('SELECT id FROM users WHERE id = ?1').bind(userId).first()
    if (!user) {
      return createErrorResponse(c, 401, '使用者不存在')
    }

    const currentTime = Math.floor(Date.now() / 1000)
    await db
      .prepare('UPDATE users SET last_login_time = ?1 WHERE id = ?2')
      .bind(currentTime, user.id)
      .run()

    const newPayload = {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 全新的 7 天效期
    }
    const newToken = await sign(newPayload, secret)

    return c.json({ success: true, token: newToken })
  } catch (error) {
    console.error('Session refresh error:', error.message)
    return createErrorResponse(c, 401, '憑證失效')
  }
}

export const handleForgotPasswordRequest = async (c) => {
  const db = c.env.DB
  const brevoApiKey = c.env.BREVO_API_KEY
  const frontendUrl = c.env.FRONTEND_URL

  if (!frontendUrl) {
    console.error('FATAL: FRONTEND_URL environment variable is not set.')
    return createErrorResponse(c, 500, '服务器配置错误')
  }

  try {
    const { email } = await c.req.json()
    if (!email) {
      return createErrorResponse(c, 400, '需要提供邮箱地址')
    }

    const user = await db.prepare('SELECT id FROM users WHERE email = ?1').bind(email).first()

    // 安全性：无论用户是否存在，都返回成功信息
    if (user) {
      // 只有当用户存在时，才执行后续逻辑
      const resetToken = crypto.randomUUID()
      const expiresAt = Math.floor(Date.now() / 1000) + 3600 // 1 小时后过期

      // 存入数据库
      await db
        .prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?1, ?2, ?3)')
        .bind(resetToken, user.id, expiresAt)
        .run()

      // 发送邮件
      await sendPasswordResetEmail(email, resetToken, brevoApiKey, frontendUrl)
    }

    // 统一返回成功响应，防止邮箱地址被枚举
    return c.json({ success: true, message: '如果该邮箱已注册，您将会收到一封密码重置邮件' })
  } catch (error) {
    console.error('忘记密码请求处理出错:', error)
    createErrorResponse(c, 500, error.message || '服务器内部错误')
    // 即便内部出错，也返回一个通用的成功消息
    return c.json({ success: true, message: '如果该邮箱已注册，您将会收到一封密码重置邮件' })
  }
}

export const handleResetPassword = async (c) => {
  const db = c.env.DB
  try {
    const { token, password } = await c.req.json()
    if (!token || !password || password.length < 8) {
      return createErrorResponse(c, 400, '需要提供有效的 Token 和至少 8 位的新密码')
    }

    // 查找重置 Token
    const resetRequest = await db
      .prepare('SELECT * FROM password_resets WHERE token = ?1')
      .bind(token)
      .first()
    if (!resetRequest) {
      return createErrorResponse(c, 400, '无效的重置链接')
    }

    // 检查 Token 是否过期
    if (Math.floor(Date.now() / 1000) > resetRequest.expires_at) {
      // 为安全起见，删除已过期的 token
      await db.prepare('DELETE FROM password_resets WHERE token = ?1').bind(token).run()
      return createErrorResponse(c, 400, '重置链接已过期，请重新申请')
    }

    // Token 有效，更新用户密码
    const salt = crypto.randomUUID()
    const hashedPassword = await hashPassword(password, salt)

    await db
      .prepare('UPDATE users SET hashed_password = ?1, salt = ?2 WHERE id = ?3')
      .bind(hashedPassword, salt, resetRequest.user_id)
      .run()

    // 使用过的 Token 必须立即删除
    await db.prepare('DELETE FROM password_resets WHERE token = ?1').bind(token).run()

    return c.json({ success: true, message: '密码重置成功，请使用新密码登录' })
  } catch (error) {
    console.error('重置密码时出错:', error)
    return createErrorResponse(c, 500, '服务器内部错误，请稍后重试')
  }
}

export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const secret = c.env.JWT_SECRET

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse(c, 401, 'Unauthorized: No token provided')
  }

  const token = authHeader.substring(7)

  try {
    const payload = await verify(token, secret)
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?')
      .bind(payload.sub)
      .first()

    if (!user) {
      return createErrorResponse(c, 401, 'Unauthorized: User not found')
    }

    c.set('user', user)
    await next()
  } catch (error) {
    return createErrorResponse(c, 401, `Unauthorized: ${error.message}`)
  }
}
