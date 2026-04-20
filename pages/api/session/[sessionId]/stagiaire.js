const path = require('path')
const { readJsonFile, writeJsonFile } = require('../../../../lib/utils')
const { generatePhoneticCode } = require('../../../../lib/generateCode')

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

    const stagiairesPath = path.join(FORMATIONS_DIR, sessionId, 'stagiaires.json')

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Méthode non autorisée' })
    }

    const { action } = req.body

    if (action === 'generate') {
      const stagiaires = await readJsonFile(stagiairesPath)
      let code
      let attempts = 0
      do {
        code = generatePhoneticCode()
        attempts++
      } while (stagiaires[code] && attempts < 50)

      if (stagiaires[code]) {
        return res.status(500).json({ error: 'Impossible de générer un code unique' })
      }

      // Reserve the code with a placeholder
      stagiaires[code] = null
      await writeJsonFile(stagiairesPath, stagiaires)

      return res.status(200).json({ code })
    }

    if (action === 'verify') {
      const { code } = req.body
      if (!code) {
        return res.status(400).json({ error: 'Le code est requis' })
      }

      const stagiaires = await readJsonFile(stagiairesPath)
      const exists = stagiaires.hasOwnProperty(code)

      return res.status(200).json({ exists, code })
    }

    return res.status(400).json({ error: 'Action non reconnue. Utilisez "generate" ou "verify"' })
  } catch (error) {
    console.error('Stagiaire API error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
