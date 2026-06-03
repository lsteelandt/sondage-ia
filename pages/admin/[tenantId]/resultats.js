/**
 * /admin/[tenantId]/resultats?session=ID — résultats d'un sondage.
 *
 * Auth requise. Charge le sondage depuis le tenant, affiche stats + nuages.
 * L'analyse IA est déléguée à /api/tenant/[tenantId]/analyze (Phase 5).
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AdminLayout from '../../../components/Admin/AdminLayout'
import SimpleWordCloud from '../../../components/Survey/SimpleWordCloud'

export default function ResultatsPage() {
  const router = useRouter()
  const { tenantId, session: sessionQuery } = router.query
  const [tenant, setTenant] = useState(null)
  const [sessionData, setSessionData] = useState(null)
  const [sessions, setSessions] = useState({})
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeMsg, setAnalyzeMsg] = useState('')
  const [sid, setSid] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (sessionQuery) setSid(sessionQuery)
  }, [sessionQuery, router.isReady])

  // Charger le tenant (auth) + la liste de sessions
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
          setAuthError('Erreur de chargement.')
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
          setAuthError('Erreur réseau.')
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [tenantId, router.isReady])

  // Charger la session sélectionnée
  useEffect(() => {
    if (!sid) {
      setSessionData(null)
      return
    }
    let cancelled = false
    async function loadSession() {
      try {
        const res = await fetch(`/api/tenant/${tenantId}/session/${encodeURIComponent(sid)}`, { credentials: 'include' })
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setSessionData(data)
        } else {
          setSessionData(null)
        }
      } catch (e) {
        if (!cancelled) setSessionData(null)
      }
    }
    loadSession()
    return () => { cancelled = true }
  }, [sid, tenantId])

  async function handleAnalyze() {
    if (!sid) return
    setAnalyzing(true)
    setAnalyzeMsg('Analyse IA en cours...')
    try {
      const res = await fetch(`/api/tenant/${tenantId}/analyze`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAnalyzeMsg(data.error || 'Erreur analyse')
        return
      }
      setAnalyzeMsg(`✓ ${data.message || 'Analyse terminée'}`)
      // Recharger la session
      const sRes = await fetch(`/api/tenant/${tenantId}/session/${encodeURIComponent(sid)}`, { credentials: 'include' })
      if (sRes.ok) setSessionData(await sRes.json())
    } catch (e) {
      setAnalyzeMsg('Erreur réseau')
    } finally {
      setAnalyzing(false)
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

  // Aucune session sélectionnée : sélecteur
  if (!sid) {
    const entries = Object.entries(sessions)
    return (
      <AdminLayout tenant={tenant} active="resultats">
        <Head><title>Résultats — {tenant.name}</title></Head>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Résultats</h1>
        <p className="text-sm text-white/50 mb-8">Sélectionnez un sondage pour voir ses résultats</p>
        {entries.length === 0 ? (
          <div className="glass-surface p-12 text-center">
            <p className="text-white/50">Aucun sondage disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map(([id, info]) => (
              <button
                key={id}
                onClick={() => router.push(`/admin/${tenantId}/resultats?session=${id}`)}
                className="glass-surface rounded-xl p-6 text-left hover:bg-white/[0.15] transition-colors"
              >
                <h3 className="font-semibold text-white mb-1">{info.label}</h3>
                <p className="text-sm text-white/40 font-mono">{id}</p>
                <p className="text-xs text-white/40 mt-2">{info.participantCount || 0} participant{(info.participantCount || 0) !== 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>
        )}
      </AdminLayout>
    )
  }

  // Session chargée
  if (!sessionData) {
    return (
      <AdminLayout tenant={tenant} active="resultats">
        <Head><title>Session non trouvée</title></Head>
        <div className="text-center py-12">
          <p className="text-xl text-transilio-red mb-4">Session introuvable</p>
          <a href={`/admin/${tenantId}/sondages`} className="btn-secondary">Retour aux sondages</a>
        </div>
      </AdminLayout>
    )
  }

  const rawNeeds = sessionData.keywords?.attentes || {}
  const rawFears = sessionData.keywords?.craintes || {}
  const normalizedAttentes = sessionData.normalizedKeywords?.attentes
  const normalizedCraintes = sessionData.normalizedKeywords?.craintes

  // Transforme le tableau `[{term, occurrences, originals}]` retourné par
  // l'API en dictionnaire `{term: {term, occurrences, originals}}` attendu
  // par SimpleWordCloud quand `normalized` est `true`.
  function toNormalizedDict(arr) {
    if (!Array.isArray(arr)) return null
    var dict = {}
    for (var i = 0; i < arr.length; i++) {
      var entry = arr[i]
      if (!entry || !entry.term) continue
      dict[entry.term] = entry
    }
    return dict
  }

  var needsDict = null
  var fearsDict = null
  if (normalizedAttentes && normalizedAttentes.length > 0) {
    needsDict = toNormalizedDict(normalizedAttentes)
  }
  if (normalizedCraintes && normalizedCraintes.length > 0) {
    fearsDict = toNormalizedDict(normalizedCraintes)
  }

  const needs = needsDict || rawNeeds
  const fears = fearsDict || rawFears
  const stats = {
    totalParticipants: sessionData.participantCount || 0,
    uniqueNeeds: needsDict ? Object.keys(needsDict).length : Object.keys(rawNeeds).length,
    uniqueFears: fearsDict ? Object.keys(fearsDict).length : Object.keys(rawFears).length,
  }

  return (
    <AdminLayout tenant={tenant} active="resultats">
      <Head><title>Résultats — {sessionData.label}</title></Head>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{sessionData.label}</h1>
          <p className="text-sm text-white/50 mt-1 font-mono">{sid}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-white/50 text-xs">Participants</p>
          <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
        </div>
        <div className="card p-4">
          <p className="text-white/50 text-xs">Attentes uniques</p>
          <p className="text-2xl font-bold text-white">{stats.uniqueNeeds}</p>
        </div>
        <div className="card p-4">
          <p className="text-white/50 text-xs">Craintes uniques</p>
          <p className="text-2xl font-bold text-white">{stats.uniqueFears}</p>
        </div>
        <div className="card p-4">
          <p className="text-white/50 text-xs">Mots normalisés</p>
          <p className="text-2xl font-bold text-white">
            {sessionData.normalizedKeywords ? '✓' : '—'}
          </p>
          <div className="relative group inline-block mt-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || stats.totalParticipants === 0}
              className="btn-accent text-xs px-3 py-1.5"
            >
              {analyzing ? 'Analyse en cours...' : 'Normaliser les mots par l\'IA'}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64">
              <div className="bg-gray-900 border border-white/20 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
                Si le nuage de mot contient des termes qui correspondent à un même thème, l&apos;IA les regroupe sur un seul terme.
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-white/20 rotate-45 -mt-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-surface rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Attentes</h2>
            {needsDict && (
              <span className="text-[10px] uppercase tracking-wider text-transilio-electric/80 bg-transilio-electric/10 px-2 py-0.5 rounded-full">
                Normalisé
              </span>
            )}
          </div>
          {Object.keys(needs).length > 0 ? (
            <SimpleWordCloud data={needs} title="Attentes" color="#3B82F6" normalized={!!needsDict} />
          ) : (
            <p className="text-white/40 text-sm">Aucune attente collectée</p>
          )}
        </div>
        <div className="glass-surface rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Craintes</h2>
            {fearsDict && (
              <span className="text-[10px] uppercase tracking-wider text-transilio-electric/80 bg-transilio-electric/10 px-2 py-0.5 rounded-full">
                Normalisé
              </span>
            )}
          </div>
          {Object.keys(fears).length > 0 ? (
            <SimpleWordCloud data={fears} title="Craintes" color="#FF5340" normalized={!!fearsDict} />
          ) : (
            <p className="text-white/40 text-sm">Aucune crainte collectée</p>
          )}
        </div>
      </div>

      {/* Popup de progression de l'analyse IA */}
      {(analyzing || analyzeMsg) && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm">
          <div className={
            'glass rounded-xl px-4 py-3 shadow-2xl border ' +
            (analyzing
              ? 'border-transilio-electric/50'
              : analyzeMsg.startsWith('✓')
                ? 'border-green-400/50'
                : 'border-transilio-red/50')
          }>
            <div className="flex items-start gap-3">
              {analyzing && (
                <div className="w-4 h-4 border-2 border-transilio-electric border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
              )}
              {!analyzing && (
                <span className="text-base shrink-0 mt-0.5">
                  {analyzeMsg.startsWith('✓') ? '✅' : '⚠️'}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {analyzing ? 'Normalisation IA en cours...' : 'Normalisation IA'}
                </p>
                <p className="text-xs text-white/60 mt-0.5 break-words">
                  {analyzing
                    ? 'Regroupement des termes par thème, cela peut prendre quelques secondes.'
                    : analyzeMsg.replace(/^✓\s*/, '')}
                </p>
              </div>
              {!analyzing && (
                <button
                  onClick={() => setAnalyzeMsg('')}
                  className="text-white/40 hover:text-white shrink-0 -mt-1 -mr-1 p-1"
                  aria-label="Fermer"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
