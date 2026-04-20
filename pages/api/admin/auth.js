const fs = require('fs')
const path = require('path')
const { hashPassword, verifyPassword } = require('../../../lib/hashPassword')
const { APP_CONFIG } = require('../../../data/config/app.config')

const ADMIN_FILE = path.join(process.cwd(), 'data', 'admin.json')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: 'Mot de passe requis' })
  }

  try {
    // First-time setup: create admin.json
    if (!fs.existsSync(ADMIN_FILE)) {
      const hashed = await hashPassword(password)
      fs.writeFileSync(ADMIN_FILE, JSON.stringify({ password: hashed }), 'utf-8')

      res.setHeader('Set-Cookie', `${APP_CONFIG.SESSION_COOKIE_NAME}=1; Path=/; Max-Age=${Math.floor(APP_CONFIG.SESSION_MAX_AGE / 1000)}; HttpOnly; SameSite=Strict`)
      return res.status(200).json({ firstTime: true })
    }

    // Existing admin: verify password
    const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'))
    const valid = await verifyPassword(password, admin.password)

    if (!valid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' })
    }

    res.setHeader('Set-Cookie', `${APP_CONFIG.SESSION_COOKIE_NAME}=1; Path=/; Max-Age=${Math.floor(APP_CONFIG.SESSION_MAX_AGE / 1000)}; HttpOnly; SameSite=Strict`)
    return res.status(200).json({ firstTime: false })
  } catch (err) {
    console.error('Auth error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
