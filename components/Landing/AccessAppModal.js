import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { isBusinessEmail, isValidEmail } from '../../lib/validate.js'

/**
 * Modale unifiée d'accès à l'application.
 *
 * Flux :
 *  1. L'utilisateur saisit son email professionnel.
 *  2. POST /api/tenant/request-link { email } :
 *     - si un tenant existe → magic link envoyé (200, on affiche l'écran de
 *       confirmation standard).
 *     - si aucun tenant n'existe → 404 tenant_not_found. On affiche un écran
 *       intermédiaire "Aucun espace ne correspond à cet email" avec un bouton
 *       "Créer mon espace" qui rappelle l'API avec { email, forceCreate: true }.
 *
 * Props:
 *  - open : booléen
 *  - onClose : () => void
 */
export default function AccessAppModal({ open, onClose }) {
  const [phase, setPhase] = useState('input') // 'input' | 'confirmCreate' | 'success'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const emailRef = useRef(null)

  useEffect(() => {
    if (open) {
      setPhase('input')
      setEmail('')
      setError('')
      setSuccess(null)
      setLoading(false)
      setTimeout(() => emailRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  function validateClient() {
    const trimmed = email.trim().toLowerCase()
    if (!isValidEmail(trimmed)) {
      setError('Veuillez saisir un email valide')
      return null
    }
    if (!isBusinessEmail(trimmed)) {
      setError('Veuillez utiliser votre email professionnel (gmail, outlook, orange.fr, etc. ne sont pas acceptés).')
      return null
    }
    return trimmed
  }

  async function callApi(body) {
    const res = await fetch('/api/tenant/request-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return { res, data }
  }

  function handleError(data, res) {
    if (res.status === 429) {
      setError(
        `Trop de demandes. Réessayez dans ${Math.ceil(
          (data.retryAfterSec || 3600) / 60
        )} minutes.`
      )
    } else if (data.error === 'invalid_email') {
      setError('Email invalide')
    } else if (data.error === 'personal_email_blocked') {
      setError('Veuillez utiliser votre email professionnel (gmail, outlook, orange.fr, etc. ne sont pas acceptés).')
    } else if (data.error === 'tenant_not_found') {
      // Bascule vers l'écran de confirmation de création
      setPhase('confirmCreate')
    } else if (data.error === 'smtp_not_configured') {
      setError("L'envoi d'email n'est pas configuré. Contactez l'administrateur.")
    } else {
      setError(data.message || 'Une erreur est survenue. Réessayez.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const trimmed = validateClient()
    if (!trimmed) return
    setLoading(true)
    try {
      const { res, data } = await callApi({ email: trimmed })
      if (!res.ok) {
        handleError(data, res)
        return
      }
      setSuccess({ ...data, sentTo: trimmed })
      setPhase('success')
    } catch (err) {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmCreate() {
    setError('')
    setLoading(true)
    try {
      const { res, data } = await callApi({ email, forceCreate: true })
      if (!res.ok) {
        handleError(data, res)
        return
      }
      setSuccess({ ...data, sentTo: email })
      setPhase('success')
    } catch (err) {
      setError('Impossible de contacter le serveur. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  function handleCancelCreate() {
    setPhase('input')
    setError('')
  }

  // --- Renders par phase ---

  if (phase === 'success') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-success-title"
      >
        <div
          className="bg-transilio-blue border border-white/15 rounded-xl max-w-md w-full p-6 md:p-8 shadow-2xl animate-scale-in relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-transilio-electric/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📬</span>
            </div>
            <h2
              id="access-success-title"
              className="text-2xl font-bold text-white mb-3"
            >
              Vérifiez votre boîte mail
            </h2>
            <p className="text-white/70 mb-4">
              Nous avons envoyé un lien de connexion à{' '}
              <strong className="text-white">{success.sentTo}</strong>.
            </p>
            <p className="text-white/50 text-sm mb-6">
              Le lien expire dans 1 heure. Pensez à vérifier vos spams.
            </p>
            {success.devMagicLink && (
              <div className="bg-transilio-electric/10 border border-transilio-electric/30 rounded-lg p-4 text-left">
                <p className="text-transilio-electric text-xs font-semibold mb-2 uppercase tracking-wider">
                  Lien de connexion direct
                </p>
                <a
                  href={success.devMagicLink}
                  className="text-white/80 text-xs break-all hover:text-white underline"
                >
                  {success.devMagicLink}
                </a>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary mt-6"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'confirmCreate') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-confirm-title"
      >
        <div
          className="bg-transilio-blue border border-white/15 rounded-xl max-w-md w-full p-6 md:p-8 shadow-2xl animate-scale-in relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
          <h2
            id="access-confirm-title"
            className="text-2xl font-bold text-white mb-2"
          >
            Créer votre espace ?
          </h2>
          <p className="text-white/70 text-sm mb-6">
            Aucun espace de sondage n&apos;est associé à{' '}
            <strong className="text-white">{email}</strong>. Souhaitez-vous
            en créer un ?
          </p>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-transilio-red/10 border border-transilio-red/30 text-transilio-red-light text-sm">
              {error}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCancelCreate}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Non, revenir
            </button>
            <button
              type="button"
              onClick={handleConfirmCreate}
              className="btn-accent flex-1"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer mon espace'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // phase === 'input'
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-input-title"
    >
      <div
        className="bg-transilio-blue border border-white/15 rounded-xl max-w-md w-full p-6 md:p-8 shadow-2xl animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          ✕
        </button>
        <h2
          id="access-input-title"
          className="text-2xl font-bold text-white mb-2"
        >
          Accédez à votre application de sondage
        </h2>
        <p className="text-white/60 text-sm mb-6">
          Saisissez votre email professionnel (⚠️ gmail, orange, Outlook... ne sont pas acceptés). Si un espace existe déjà,
          vous recevrez un lien magique pour y accéder. Sinon, vous pourrez
          en créer un.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block mb-4">
            <span className="text-white/80 text-sm font-medium mb-2 block">
              Votre email professionnel
            </span>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@organisation.fr"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-transilio-electric focus:ring-2 focus:ring-transilio-electric/30 transition-all"
              required
              maxLength={200}
              disabled={loading}
            />
          </label>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-transilio-red/10 border border-transilio-red/30 text-transilio-red-light text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-accent flex-1"
              disabled={loading}
            >
              {loading ? 'Envoi...' : 'Recevoir mon lien'}
            </button>
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/super-admin/login"
              className="text-white/40 hover:text-white text-xs underline underline-offset-4 transition-colors"
            >
              Accès super-admin
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
