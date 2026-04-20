const path = require('path')
const { readJsonFile, writeJsonFile } = require('../../../lib/utils')

const FORMATIONS_DIR = path.join(process.cwd(), 'data', 'formations')
const FORMATIONS_PATH = path.join(FORMATIONS_DIR, 'formations.json')

module.exports = async function handler(req, res) {
  const { sessionId } = req.query
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId est requis' })
  }

  try {
    const formations = await readJsonFile(FORMATIONS_PATH)
    if (!formations[sessionId]) {
      return res.status(404).json({ error: 'Formation non trouvée' })
    }

    const sessionDir = path.join(FORMATIONS_DIR, sessionId)
    const stagiairesPath = path.join(sessionDir, 'stagiaires.json')
    const keywordsPath = path.join(sessionDir, 'keywords.json')

    if (req.method === 'GET') {
      const stagiaires = await readJsonFile(stagiairesPath)
      const keywords = await readJsonFile(keywordsPath)

      return res.status(200).json({
        stagiaires,
        keywords,
        info: formations[sessionId],
      })
    }

    if (req.method === 'POST') {
      const { stagiaireId, attentes, craintes } = req.body
      if (!stagiaireId) {
        return res.status(400).json({ error: 'stagiaireId est requis' })
      }

      // Save stagiaire response
      const stagiaires = await readJsonFile(stagiairesPath)
      stagiaires[stagiaireId] = { attentes: attentes || [], craintes: craintes || [] }
      await writeJsonFile(stagiairesPath, stagiaires)

      // Update keyword counts
      const keywords = await readJsonFile(keywordsPath)
      for (const kw of (attentes || [])) {
        keywords[kw] = (keywords[kw] || 0) + 1
      }
      for (const kw of (craintes || [])) {
        keywords[kw] = (keywords[kw] || 0) + 1
      }
      await writeJsonFile(keywordsPath, keywords)

      // Update stagiaireCount in formations.json
      formations[sessionId].stagiaireCount = Object.keys(stagiaires).length
      await writeJsonFile(FORMATIONS_PATH, formations)

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Méthode non autorisée' })
  } catch (error) {
    console.error('Session API error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
