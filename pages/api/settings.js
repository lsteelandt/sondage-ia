import path from 'path'
import { readJsonFile } from '../../lib/utils'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')

export default async function handler(req, res) {
  try {
    var settings = await readJsonFile(SETTINGS_PATH)
    res.status(200).json(settings)
  } catch (error) {
    console.error('Settings API error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
