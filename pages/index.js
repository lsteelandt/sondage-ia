import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function Home() {
  const router = useRouter()
  const { session } = router.query
  const [participantCode, setParticipantCode] = useState('')

  // Si on arrive avec ?session=ID, rediriger directement vers /survey?session=ID
  useEffect(function () {
    if (session && router.isReady) {
      router.replace('/survey?session=' + encodeURIComponent(session))
    }
  }, [session, router.isReady])

  // Afficher un loader pendant la redirection automatique
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-transilio-blue">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[#0F1459]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-transilio-electric/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-transilio-red/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="z-10 text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Redirection vers le sondage...</p>
        </div>
      </div>
    )
  }

  const handleJoinWithCode = (e) => {
    e.preventDefault()
    if (participantCode.trim()) {
      router.push('/survey?session=' + encodeURIComponent(participantCode.trim()))
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
          <title>Sondage Intro - Formation Transilio</title>
          <meta name="description" content="Sondage d&apos;introduction à la formation Transilio" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <h1 className="text-5xl font-bold text-white mb-6">
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Bienvenue
          </span>
        </h1>

        <p className="text-xl text-white/80 mb-12">
          Ce sondage permet de préparer votre session de formation.<br />
          Vos réponses aideront le formateur à adapter le contenu à vos besoins.
        </p>

        <div className="flex flex-col gap-4">
          {/* Saisie du code de session */}
          <form onSubmit={handleJoinWithCode} className="flex gap-3">
            <input
              type="text"
              value={participantCode}
              onChange={(e) => setParticipantCode(e.target.value)}
              placeholder="Saisissez votre code de session"
              className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-transilio-electric focus:ring-2 focus:ring-transilio-electric/30 transition-all text-base"
            />
            <button
              type="submit"
              disabled={!participantCode.trim()}
              className="btn-primary px-8 py-4 text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rejoindre
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
