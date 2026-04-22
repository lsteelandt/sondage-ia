import path from 'path'
import { readJsonFile } from '../../../lib/utils'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const settings = await readJsonFile(SETTINGS_PATH)
  const cookieName = settings.session?.cookieName || 'survey_admin_session'

  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`)
  return res.status(200).json({ ok: true })
}
