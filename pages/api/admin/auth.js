import fs from 'fs'
import path from 'path'
import { hashPassword, verifyPassword } from '../../../lib/hashPassword'
import { readJsonFile } from '../../../lib/utils'

const ADMIN_FILE = path.join(process.cwd(), 'data', 'admin.json')
const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')

function hasValidHash() {
  try {
    if (!fs.existsSync(ADMIN_FILE)) return false
    const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'))
    return !!(admin && admin.password && admin.password.length > 0)
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: 'Mot de passe requis' })
  }

  try {
    const settings = await readJsonFile(SETTINGS_PATH)
    const cookieName = settings.session?.cookieName || 'survey_admin_session'
    const maxAge = Math.floor((settings.session?.maxAgeMs || 1800000) / 1000)

    if (!hasValidHash()) {
      // First-time setup: hash and save
      const hashed = await hashPassword(password)
      const dir = path.dirname(ADMIN_FILE)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(ADMIN_FILE, JSON.stringify({ password: hashed }), 'utf-8')

      res.setHeader('Set-Cookie', `${cookieName}=1; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict`)
      return res.status(200).json({ authenticated: true })
    }

    // Existing admin: verify password
    const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'))
    const valid = await verifyPassword(password, admin.password)

    if (!valid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' })
    }

    res.setHeader('Set-Cookie', `${cookieName}=1; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict`)
    return res.status(200).json({ authenticated: true })
  } catch (err) {
    console.error('Auth error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
