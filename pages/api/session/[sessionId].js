import path from 'path'
import { readJsonFile, writeJsonFile } from '../../../lib/utils'

const SESSIONS_PATH = path.join(process.cwd(), 'data', 'sessions.json')

export default async function handler(req, res) {
  var sessionId = req.query.sessionId

  try {
    var sessions = await readJsonFile(SESSIONS_PATH)

    if (req.method === 'GET') {
      // Récupérer les données d'une session spécifique
      if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ error: 'Session non trouvée' })
      }

      var sessionData = sessions[sessionId]

      // Calculer les agrégats needs/fears pour le nuage de mots
      var needsAgg = {}
      var fearsAgg = {}

      ;(sessionData.responses || []).forEach(function (response) {
        ;(response.needs || []).forEach(function (word) {
          needsAgg[word] = (needsAgg[word] || 0) + 1
        })
        ;(response.fears || []).forEach(function (word) {
          fearsAgg[word] = (fearsAgg[word] || 0) + 1
        })
      })

      return res.status(200).json({
        id: sessionData.id,
        label: sessionData.label,
        createdAt: sessionData.createdAt,
        participantCount: sessionData.participantCount || 0,
        responses: sessionData.responses || [],
        // Agrégats pour nuages de mots
        keywords: {
          attentes: needsAgg,
          craintes: fearsAgg,
        },
        // Termes normalisés par l'IA
        normalizedKeywords: sessionData.normalizedKeywords || null,
      })
    }

    if (req.method === 'POST') {
      // Ajouter une réponse de sondage à une session
      if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ error: 'Session non trouvée' })
      }

      var body = req.body

      // Structure attendue : { id: "BUDAP", needs: [...], fears: [...] }
      var response = {
        id: body.id || 'UNKNOWN',
        submittedAt: new Date().toISOString(),
        needs: body.needs || [],
        fears: body.fears || [],
      }

      if (!sessions[sessionId].responses) {
        sessions[sessionId].responses = []
      }

      sessions[sessionId].responses.push(response)
      sessions[sessionId].participantCount = sessions[sessionId].responses.length

      await writeJsonFile(SESSIONS_PATH, sessions)
      return res.status(201).json({ success: true, id: response.id })
    }

    return res.status(405).json({ error: 'Méthode non autorisée' })
  } catch (error) {
    console.error('Session API error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
