const path = require('path')
const { readJsonFile } = require('../../lib/utils')

const CRAINTES_PATH = path.join(process.cwd(), 'data', 'config', 'craintes.json')

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const data = await readJsonFile(CRAINTES_PATH)
    return res.status(200).json(data)
  } catch (error) {
    console.error('Craintes API error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
