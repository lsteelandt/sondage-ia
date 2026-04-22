import { useState } from 'react'
import Image from 'next/image'

export default function AuthForm({ firstTime }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (firstTime && password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur')
        setLoading(false)
        return
      }

      window.location.href = '/admin/sessions'
    } catch {
      setError('Erreur réseau')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 gradient-overlay pointer-events-none" />

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-transilio-electric/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-transilio-red/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo Transilio */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-transilio.png"
            alt="Transilio"
            width={200}
            height={60}
            className="drop-shadow-lg"
            priority
          />
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-glow">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {firstTime
                ? 'Configuration initiale'
                : 'Connexion administrateur'}
            </h1>
            <p className="text-white/60 text-sm">
              {firstTime
                ? 'Créez votre mot de passe pour sécuriser l\'accès'
                : 'Entrez votre mot de passe pour accéder à l\'espace admin'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="label">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={function (e) { setPassword(e.target.value) }}
                  placeholder="••••••••"
                  className="input-field pl-10"
                  required
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>

            {/* Confirm Password (First Time Only) */}
            {firstTime && (
              <div>
                <label htmlFor="confirm" className="label">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={function (e) { setConfirm(e.target.value) }}
                    placeholder="••••••••"
                    className="input-field pl-10"
                    required
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-transilio-red/20 border border-transilio-red/30 rounded-classic px-4 py-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-transilio-red flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-white">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  Chargement...
                  <svg className="w-4 h-4 ml-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </>
              ) : (
                <>
                  {firstTime ? 'Créer le mot de passe' : 'Se connecter'}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link (Not First Time) */}
        {!firstTime && (
          <div className="mt-6 text-center">
            <a href="/" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour au sondage
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
