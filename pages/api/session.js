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
  if (req.method === 'POST') {
    const { id, surname, name, fear, fears, wordcloud, feedback } = req.body

    if (!id || !name) {
      res.status(400).json({ error: 'id et name sont requis' })
      return
    }

    // Sauvegarder la session
    const survey = {
      id,
      surname,
      name,
      fear,
      fears,
      wordcloud,
      feedback
    }

    await db.collection('survey').insertOne(survey)

    res.status(201).json({ success: true })
  } else if (req.method === 'GET') {
    // Récupérer toutes les sessions
    const sessions = await db.collection('survey').find({}).toArray()

    // Formater les sessions pour l'admin
    var result = {}
    sessions.forEach(function (s) {
      result[s.id] = s.name
    })

    res.json(result)
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' })
  }
}
