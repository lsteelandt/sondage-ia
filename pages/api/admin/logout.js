const { APP_CONFIG } = require('../../../data/config/app.config')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Set-Cookie', `${APP_CONFIG.SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`)
  return res.status(200).json({ ok: true })
}
