import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 10,
  minPoolSize: 0,
  socketTimeoutMS: 45000,
  family: 4
}

const client = new MongoClient(uri, options)
const db = client.db('sondage')

export default async function handler(req, res) {
  const { sessionId } = req.query
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId est requis' })
  }

  try {
    // Vérifier que la session existe
    const existingSession = await db.collection('survey').findOne({ id: sessionId })
    if (!existingSession) {
      return res.status(404).json({ error: 'Formation non trouvée' })
    }

    if (req.method === 'GET') {
      // Récupérer toutes les réponses pour cette session
      const responses = await db.collection('survey').find({ id: sessionId }).toArray()

      // Agréger par participant
      var participantMap = {}
      responses.forEach(function (r) {
        if (!participantMap[r.participantId]) {
          participantMap[r.participantId] = {
            participantId: r.participantId,
            attentes: [],
            craintes: []
          }
        }
        ;(participantMap[r.participantId].attentes || []).push(...(r.attentes || []))
        ;(participantMap[r.participantId].craintes || []).push(...(r.craintes || []))
      })

      // Normaliser les mots-clés (retirer les accents, mettre en minuscule)
      function normalizeKeyword(kw) {
        return kw
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
      }

      // Regrouper les mots-clés
      var aggregatedParticipants = []
      Object.entries(participantMap).forEach(function ([participantId, data]) {
        const entry = { participantId }

        // Regrouper les mots-clés attendus
        const setAttentes = new Set()
        data.attentes.forEach(function (kw) {
          const key = normalizeKeyword(kw)
          setAttentes.add(key)
        })
        entry.attentes = Array.from(setAttentes)

        // Regrouper les mots-clés craints
        const setCraintes = new Set()
        data.craintes.forEach(function (kw) {
          const key = normalizeKeyword(kw)
          setCraintes.add(key)
        })
        entry.craintes = Array.from(setCraintes)

        aggregatedParticipants.push(entry)
      })

      // Trier par nombre de craintes (décroissant)
      aggregatedParticipants.sort(function (a, b) {
        return b.craintes.length - a.craintes.length
      })

      return res.status(200).json({
        responses: aggregatedParticipants,
        info: existingSession
      })
    }

    if (req.method === 'POST') {
      const { participantId, attentes, craintes } = req.body
      if (!participantId) {
        return res.status(400).json({ error: 'participantId est requis' })
      }

      // Vérifier que l'utilisateur n'a pas déjà répondu
      const existingResponse = await db.collection('survey').findOne({
        id: sessionId,
        'participantId': participantId
      })

      if (existingResponse) {
        return res.status(400).json({ error: 'Déjà répondu à ce sondage' })
      }

      // Créer une nouvelle réponse
      const response = {
        participantId,
        attentes: attentes || [],
        craintes: craintes || [],
        createdAt: new Date().toISOString()
      }

      await db.collection('survey').insertOne({
        id: sessionId,
        ...response
      })

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Méthode non autorisée' })
  } catch (error) {
    console.error('Session API error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
