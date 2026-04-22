import path from 'path'
import { readJsonFile } from '../../lib/utils'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const settings = await readJsonFile(SETTINGS_PATH)
    return res.status(200).json({ craintes: settings.craintes || [] })
  } catch (error) {
    console.error('Craintes API error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
