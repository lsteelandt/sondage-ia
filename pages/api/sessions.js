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
  try {
    if (req.method === 'GET') {
      // Charger toutes les sessions depuis MongoDB
      const sessions = await db.collection('survey').find({}).toArray()

      // Formater pour l'admin : { [sessionId]: sessionName }
      var formatted = {}
      sessions.forEach(function (s) {
        formatted[s.id] = s.name
      })

      return res.status(200).json(formatted)
    }

    if (req.method === 'POST') {
      const { id, name } = req.body

      if (!id || !name) {
        return res.status(400).json({ error: 'id et name sont requis' })
      }

      // Créer la session
      const survey = {
        id,
        name,
        surname: '',
        fear: '',
        fears: '',
        wordcloud: '',
        feedback: '',
        createdAt: new Date().toISOString()
      }

      await db.collection('survey').insertOne(survey)

      // Mettre à jour le compteur de participants
      await db.collection('survey').updateOne({ id }, { $inc: { participantCount: 1 } })

      return res.status(201).json({ id, name })
    }

    return res.status(405).json({ error: 'Méthode non autorisée' })
  } catch (error) {
    console.error('Sessions API error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
