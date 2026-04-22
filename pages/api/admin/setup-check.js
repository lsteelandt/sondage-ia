import fs from 'fs'
import path from 'path'

const ADMIN_FILE = path.join(process.cwd(), 'data', 'admin.json')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let setup = false
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      const raw = fs.readFileSync(ADMIN_FILE, 'utf-8')
      const admin = JSON.parse(raw)
      setup = !!(admin && admin.password && admin.password.length > 0)
    }
  } catch {
    setup = false
  }

  return res.status(200).json({ setup })
}
