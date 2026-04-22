// pages/index.js
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(function () {
    // Charger les formations depuis l'API
    fetch('/api/sessions')
      .then(function (res) {
        if (!res.ok) {
          console.error('Erreur chargement sessions')
          return []
        }
        return res.json()
      })
      .then(function (data) {
        setSessions(data)
      })
      .catch(function (err) {
        console.error('Erreur:', err)
      })
      .finally(function () {
        setLoadingSessions(false)
      })
  }, [])

  const handleStartSurvey = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          surname: '',
          name: '',
          fear: '',
          fears: '',
          wordcloud: '',
          feedback: ''
        })
      })

      if (response.ok) {
        router.push('/survey')
      } else {
        console.error('Erreur lors du démarrage du sondage')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#0F1459]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-transilio-electric/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-transilio-red/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-transilio-blue-light/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="z-10 text-center max-w-lg w-full animate-scale-in">
        <Head>
          <title>Sondage Transilio</title>
          <meta name="description" content="Participez au sondage Transilio" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <h1 className="text-6xl font-bold text-white mb-6">
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Sondage
          </span>
        </h1>

        <p className="text-xl text-white/80 mb-12">
          Découvrez comment Transilio peut vous aider face à vos peurs et défis.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            onClick={handleStartSurvey}
            disabled={isLoading}
            className="btn-primary w-full sm:w-auto text-lg px-12 py-6 flex items-center justify-center gap-4"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.25.98l3.197-2.132a1 1 0 00-.502-1.682zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {isLoading ? 'Chargement...' : 'Commencer le sondage'}
          </button>

          <a
            href="https://transilio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full sm:w-auto text-lg px-12 py-6 flex items-center justify-center gap-4"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            En savoir plus
          </a>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-white/60">
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-3xl mb-2">🔒</div>
            <div className="font-medium">Anonyme</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-medium">Rapide</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="text-3xl mb-2">🎯</div>
            <div className="font-medium">Pertinent</div>
          </div>
        </div>

        {loadingSessions ? (
          <div className="mt-8 text-center text-white/60">Chargement des formations...</div>
        ) : sessions.length === 0 ? (
          <div className="mt-8 text-center text-white/60">Aucune formation disponible</div>
        ) : (
          <div className="mt-8">
            <h3 className="text-white/80 font-medium mb-3">Formations disponibles :</h3>
            <div className="flex flex-wrap gap-2">
              {sessions.map(function (session) {
                return (
                  <a
                    key={session.id}
                    href={`/admin/resultats?session=${session.id}`}
                    className="inline-flex items-center px-3 py-1.5 bg-white/10 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors text-sm"
                  >
                    {session.title}
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}