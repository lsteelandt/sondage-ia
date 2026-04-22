// pages/api/sessions.js
import path from 'path'
import { readJsonFile, writeJsonFile, generateHexId } from '../../lib/utils'

const SESSIONS_PATH = path.join(process.cwd(), 'data', 'sessions.json')

export default async function handler(req, res) {
  try {
    const sessions = await readJsonFile(SESSIONS_PATH)

    if (req.method === 'GET') {
      // Retourner la liste des formations
      return res.status(200).json(sessions)
    }

    if (req.method === 'POST') {
      // Créer une nouvelle formation
      const { label } = req.body
      if (!label || !label.trim()) {
        return res.status(400).json({ error: 'Le nom de la formation est requis' })
      }

      const id = generateHexId(8)
      const now = new Date().toISOString()

      sessions[id] = {
        id,
        label: label.trim(),
        createdAt: now,
        participantCount: 0,
        responses: []
      }

      await writeJsonFile(SESSIONS_PATH, sessions)
      return res.status(201).json({ id, label: label.trim(), createdAt: now, participantCount: 0 })
    }

    if (req.method === 'DELETE') {
      // Supprimer une formation
      const { sessionId } = req.body
      if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ error: 'Formation non trouvée' })
      }

      delete sessions[sessionId]
      await writeJsonFile(SESSIONS_PATH, sessions)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Méthode non autorisée' })
  } catch (error) {
    console.error('Sessions API error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
