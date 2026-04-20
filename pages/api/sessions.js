const path = require('path')
const { readJsonFile, writeJsonFile, ensureDir, generateHexId } = require('../../lib/utils')

const FORMATIONS_PATH = path.join(process.cwd(), 'data', 'formations', 'formations.json')

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const formations = await readJsonFile(FORMATIONS_PATH)
      return res.status(200).json(formations)
    }

    if (req.method === 'POST') {
      const { label } = req.body
      if (!label) {
        return res.status(400).json({ error: 'Le label est requis' })
      }

      const formations = await readJsonFile(FORMATIONS_PATH)
      const sessionId = generateHexId()

      formations[sessionId] = {
        label,
        createdAt: new Date().toISOString(),
        stagiaireCount: 0,
      }

      await writeJsonFile(FORMATIONS_PATH, formations)

      const sessionDir = path.join(process.cwd(), 'data', 'formations', sessionId)
      await ensureDir(sessionDir)
      await writeJsonFile(path.join(sessionDir, 'stagiaires.json'), {})
      await writeJsonFile(path.join(sessionDir, 'keywords.json'), {})

      return res.status(201).json({ sessionId, label })
    }

    if (req.method === 'DELETE') {
      const { sessionId } = req.body
      if (!sessionId) {
        return res.status(400).json({ error: 'Le sessionId est requis' })
      }

      const formations = await readJsonFile(FORMATIONS_PATH)
      if (!formations[sessionId]) {
        return res.status(404).json({ error: 'Formation non trouvée' })
      }

      delete formations[sessionId]
      await writeJsonFile(FORMATIONS_PATH, formations)

      const fs = require('fs/promises')
      const sessionDir = path.join(process.cwd(), 'data', 'formations', sessionId)
      await fs.rm(sessionDir, { recursive: true }).catch(() => {})

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Méthode non autorisée' })
  } catch (error) {
    console.error('Sessions API error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
