/**
 * /admin/[tenantId]/sondages — espace de sondages du tenant (page unique).
 *
 * Auth requise (cookie survey_session_${tenantId}).
 * Affiche en haut les 3 cartes (Sondages créés n/3, Réponses totales,
 * ID Organisation) puis la liste des sondages avec leurs actions.
 * Limite : 3 sondages max par tenant.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AdminLayout from '../../../components/Admin/AdminLayout'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const LIMIT_MESSAGE =
  'Limite de 3 sondages atteinte. Si vous avez besoin de plus, contactez-nous à contact@transilio.fr'

const SONDAGES_MAX = 3

export default function TenantSondagesPage() {
  const router = useRouter()
  const { tenantId } = router.query
  const [tenant, setTenant] = useState(null)
  const [sessions, setSessions] = useState({})
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (!tenantId || !router.isReady) return
    let cancelled = false
    async function load() {
      try {
        const meRes = await fetch(`/api/tenant/${tenantId}/me`, { credentials: 'include' })
        if (cancelled) return
        if (meRes.status === 401) {
          setAuthError('Non authentifié. Demandez un nouveau lien magique.')
          setLoading(false)
          return
        }
        if (!meRes.ok) {
          setAuthError('Erreur de chargement du tenant.')
          setLoading(false)
          return
        }
        const meData = await meRes.json()
        setTenant(meData.tenant)
        const sRes = await fetch(`/api/tenant/${tenantId}/sondages`, { credentials: 'include' })
        if (cancelled) return
        if (sRes.ok) {
          const sData = await sRes.json()
          setSessions(sData)
        }
        setLoading(false)
      } catch (e) {
        if (!cancelled) {
          setAuthError('Erreur réseau. Réessayez.')
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [tenantId, router.isReady])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newLabel.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch(`/api/tenant/${tenantId}/sondages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        if (data.error === 'limit_reached') {
          setError(data.message || LIMIT_MESSAGE)
        } else {
          setError(data.error || 'Erreur')
        }
      } else {
        setNewLabel('')
        const sRes = await fetch(`/api/tenant/${tenantId}/sondages`, { credentials: 'include' })
        if (sRes.ok) setSessions(await sRes.json())
      }
    } catch (e) {
      setError('Erreur réseau')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(sessionId, label) {
    if (!confirm(`Supprimer "${label}" ? Cette action est irréversible.`)) return
    try {
      const res = await fetch(`/api/tenant/${tenantId}/sondages`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (res.ok) {
        const sRes = await fetch(`/api/tenant/${tenantId}/sondages`, { credentials: 'include' })
        if (sRes.ok) setSessions(await sRes.json())
      }
    } catch (e) {
      setError('Erreur lors de la suppression')
    }
  }

  function handleCopy(sessionId, url) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(sessionId)
        setTimeout(() => setCopiedId(null), 2000)
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transilio-blue">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transilio-blue">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <Head><title>Connexion requise</title></Head>
          <h1 className="text-2xl font-bold text-white mb-4">Connexion requise</h1>
          <p className="text-white/70 mb-6">{authError}</p>
          <a href="/" className="btn-primary inline-block">Retour</a>
        </div>
      </div>
    )
  }

  const entries = Object.entries(sessions)
  const atLimit = entries.length >= SONDAGES_MAX
  const totalParticipants = entries.reduce(
    (sum, [, s]) => sum + (s.participantCount || 0),
    0
  )
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <AdminLayout tenant={tenant} active="sondages">
      <Head><title>Espace de sondages — {tenant.name}</title></Head>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Bienvenue dans votre espace de création de sondage
        </h1>
        <p className="text-white/60">
          Voici l&apos;état de vos sondages.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <p className="text-white/50 text-sm mb-1">Sondages créés</p>
          <p className="text-3xl font-bold text-white">
            {entries.length}
            <span className="text-white/30 text-lg"> / {SONDAGES_MAX}</span>
          </p>
        </div>
        <div className="card p-6">
          <p className="text-white/50 text-sm mb-1">Réponses totales</p>
          <p className="text-3xl font-bold text-white">{totalParticipants}</p>
        </div>
        <div className="card p-6">
          <p className="text-white/50 text-sm mb-1">ID Organisation</p>
          <p className="text-lg font-mono text-white/80 break-all">{tenant.id}</p>
        </div>
      </div>

      <div className="glass-surface rounded-xl p-6 mb-6">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={atLimit ? 'Limite de 3 sondages atteinte' : 'Nom du nouveau sondage'}
            className="input-field flex-1 disabled:opacity-50"
            maxLength={120}
            disabled={atLimit}
          />
          <button
            type="submit"
            disabled={creating || !newLabel.trim() || atLimit}
            className="btn-accent"
          >
            {creating ? 'Création...' : 'Créer le sondage'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-transilio-red/20 border border-transilio-red/30 text-white rounded-xl px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="glass-surface p-12 text-center">
          <p className="text-white/50 mb-2">Aucun sondage créé</p>
          <p className="text-sm text-white/30">Créez votre premier sondage pour commencer à collecter des réponses.</p>
        </div>
      )}

      <div className="space-y-4">
        {entries.map(([id, info]) => {
          const surveyUrl = `${origin}/survey?tenantId=${tenantId}&session=${id}`
          return (
            <div key={id} className="glass-surface rounded-xl p-6 hover:bg-white/[0.15] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-white text-lg mb-2 truncate">{info.label}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                    <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">{id}</span>
                    <span>{info.participantCount || 0} participant{(info.participantCount || 0) !== 1 ? 's' : ''}</span>
                    <span>{formatDate(info.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {(info.participantCount || 0) > 0 ? (
                    <a
                      href={`/admin/${tenantId}/resultats?session=${id}`}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      Résultats
                    </a>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-center px-4 py-2 text-sm text-white/40 bg-white/5 rounded-xl cursor-not-allowed"
                    >
                      Résultats
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(id, info.label)}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm text-transilio-red hover:bg-transilio-red/10 rounded-xl transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={surveyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-transilio-electric hover:text-white text-sm font-mono underline underline-offset-2 truncate max-w-xs"
                    title={surveyUrl}
                  >
                    {surveyUrl}
                  </a>
                  <button
                    onClick={() => handleCopy(id, surveyUrl)}
                    title="Copier le lien du sondage"
                    className={
                      'shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ' +
                      (copiedId === id
                        ? 'bg-transilio-electric text-white'
                        : 'bg-white/10 text-white hover:bg-white/20')
                    }
                  >
                    {copiedId === id ? '✓ Copié' : 'Copier'}
                  </button>
                  <span className="text-white/40 text-xs text-right">
                    ← Cliquez ici pour envoyer le lien à vos collaborateurs par votre messagerie
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
