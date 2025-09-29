/**
 * 發送驗證碼郵件
 * @param {string} toEmail - 收件人郵箱
 * @param {string} verificationCode - 6 位數字驗證碼
 * @param {string} apiKey - Brevo API 金鑰
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (toEmail, verificationCode, apiKey) => {
  const SENDER_NAME = 'Uclimax-TCGTool for WS'
  const SENDER_EMAIL = 'noreply@uclimax.cn'

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
      },
      to: [
        {
          email: toEmail,
        },
      ],
      subject: `您的验证码是 ${verificationCode}`,
      htmlContent: `<html><body><p>您好，</p><p>您的账号验证码是：<b>${verificationCode}</b></p><p>此验证码将在 10 分钟后失效。</p></body></html>`,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Brevo API Error:', response.status, errorData)
    throw new Error('邮件发送失败，请稍后重试。')
  }
}
