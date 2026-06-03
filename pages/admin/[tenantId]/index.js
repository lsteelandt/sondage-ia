/**
 * /admin/[tenantId] — point d'entrée admin.
 *
 * Cette page redirige vers /admin/[tenantId]/sondages, qui est la page
 * unique de l'espace de sondages (cartes stats + liste des sondages).
 *
 * Important : on garde la même logique d'auth et de consommation du
 * magic link que dans les pages internes, pour que les liens magiques
 * `?token=XXX` reçus par email fonctionnent depuis n'importe quelle
 * sous-route admin.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function AdminRedirect() {
  const router = useRouter()
  const { tenantId } = router.query
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !router.isReady) return
    let cancelled = false

    async function consume() {
      // Si un magic link est présent, on le consomme d'abord (sinon la
      // redirection nous perdrait le token).
      const tokenFromQuery = router.query.token
      if (tokenFromQuery && typeof tokenFromQuery === 'string') {
        try {
          const consumeRes = await fetch('/api/tenant/consume-magic-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId, token: tokenFromQuery }),
            credentials: 'include',
          })
          if (consumeRes.ok) {
            if (cancelled) return
            router.replace(`/admin/${tenantId}/sondages`)
            return
          }
          const errData = await consumeRes.json().catch(() => ({}))
          setAuthError(
            errData.error === 'invalid_or_expired_link'
              ? 'Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau.'
              : 'Lien invalide.'
          )
          setLoading(false)
          return
        } catch {
          setAuthError('Erreur réseau. Réessayez.')
          setLoading(false)
          return
        }
      }

      // Pas de magic link : on vérifie juste qu'on est authentifié pour ce tenant.
      try {
        const meRes = await fetch(`/api/tenant/${tenantId}/me`, { credentials: 'include' })
        if (cancelled) return
        if (meRes.status === 401) {
          setAuthError("Vous n'êtes pas authentifié. Demandez un nouveau lien magique.")
          setLoading(false)
          return
        }
        if (!meRes.ok) {
          setAuthError('Erreur de chargement du tenant.')
          setLoading(false)
          return
        }
        router.replace(`/admin/${tenantId}/sondages`)
      } catch {
        if (!cancelled) {
          setAuthError('Erreur réseau. Réessayez.')
          setLoading(false)
        }
      }
    }
    consume()
    return () => { cancelled = true }
  }, [tenantId, router.isReady, router.query.token])

  if (loading && !authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transilio-blue">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transilio-blue">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center animate-scale-in">
          <Head><title>Connexion requise — Sondage IA Admin</title></Head>
          <h1 className="text-2xl font-bold text-white mb-4">Connexion requise</h1>
          <p className="text-white/70 mb-6">{authError}</p>
          <Link href="/" className="btn-primary inline-block">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  return null
}
