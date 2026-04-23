import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '../../components/Admin/AdminLayout'
import SimpleWordCloud from '../../components/Survey/SimpleWordCloud'

export default function ResultatsPage() {
  var mounted = useState(false)
  var setMounted = mounted[1]
  mounted = mounted[0]

  var sid = useState('')
  var setSid = sid[1]
  sid = sid[0]

  var data = useState(null)
  var setData = data[1]
  data = data[0]

  var loading = useState(true)
  var setLoading = loading[1]
  loading = loading[0]

  var error = useState('')
  var setError = error[1]
  error = error[0]

  var analyzing = useState(false)
  var setAnalyzing = analyzing[1]
  analyzing = analyzing[0]

  var analyzeMsg = useState('')
  var setAnalyzeMsg = analyzeMsg[1]
  analyzeMsg = analyzeMsg[0]

  var progressMessages = useState([])
  var setProgressMessages = progressMessages[1]
  progressMessages = progressMessages[0]

  var formations = useState({})
  var setFormations = formations[1]
  formations = formations[0]

  useEffect(function () {
    if (typeof window === 'undefined') return
    var params = new URLSearchParams(window.location.search)
    var s = params.get('session') || ''
    setSid(s)
    setMounted(true)
  }, [])

  useEffect(function () {
    if (!mounted) return

    // Charger la liste des formations
    fetch('/api/sessions')
      .then(function (res) {
        if (!res.ok) throw new Error('Erreur chargement sessions')
        return res.json()
      })
      .then(function (sessions) {
        var formatted = {}
        Object.entries(sessions).forEach(function (entry) {
          formatted[entry[0]] = entry[1].label
        })
        setFormations(formatted)
      })
      .catch(function (e) {
        console.error('Erreur chargement sessions:', e)
      })

    if (!sid) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetch('/api/session/' + encodeURIComponent(sid))
      .then(function (res) {
        if (!res.ok) throw new Error('Formation non trouvée')
        return res.json()
      })
      .then(function (d) {
        setData(d)
        setLoading(false)
      })
      .catch(function (e) {
        setError(e.message || 'Erreur')
        setLoading(false)
      })
  }, [mounted, sid])

  function handleExport() {
    if (!data) return
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'resultats-' + sid + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Stats calculées
  function getStats() {
    if (!data) return null
    var needs = data.keywords ? data.keywords.attentes || {} : {}
    var fears = data.keywords ? data.keywords.craintes || {} : {}
    return {
      totalParticipants: data.participantCount || 0,
      uniqueNeeds: Object.keys(needs).length,
      uniqueFears: Object.keys(fears).length,
      totalNeedsMentions: Object.values(needs).reduce(function (a, b) { return a + b }, 0),
      totalFearsMentions: Object.values(fears).reduce(function (a, b) { return a + b }, 0),
    }
  }

  // Server + first client render: always show loader
  if (!mounted) {
    return (
      <AdminLayout>
        <Head><title>Résultats - Sondage IA Admin</title></Head>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    )
  }

  // No session selected: show formations list to pick one
  if (!sid) {
    var entries = Object.entries(formations)
    return (
      <AdminLayout>
        <Head><title>Résultats - Sondage IA Admin</title></Head>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Résultats</h1>
            <p className="text-sm text-white/50 mt-1">Sélectionnez une formation pour voir ses résultats</p>
          </div>
          <div className="glass-surface rounded-xl px-6 py-4">
            <p className="text-3xl font-bold text-white">{entries.length}</p>
            <p className="text-xs text-white/40">formation{entries.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="glass-surface p-12 text-center">
            <p className="text-white/50">Aucune formation disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map(function (e) {
              var id = e[0]
              var title = e[1]
              return (
                <button
                  key={id}
                  onClick={function () { setSid(id) }}
                  className="glass-surface rounded-xl p-6 text-left hover:bg-white/[0.15] transition-colors"
                >
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-sm text-white/40 font-mono">{id}</p>
                </button>
              )
            })}
          </div>
        )}
      </AdminLayout>
    )
  }

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <Head><title>Résultats - Sondage IA Admin</title></Head>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <Head><title>Résultats - Sondage IA Admin</title></Head>
        <div className="text-center py-12">
          <p className="text-xl text-transilio-red mb-4">{error}</p>
          <button
            onClick={function () { window.history.back() }}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>
      </AdminLayout>
    )
  }

  // Success: render results with word clouds
  var stats = getStats()
  var needsData = data.keywords ? data.keywords.attentes || {} : {}
  var fearsData = data.keywords ? data.keywords.craintes || {} : {}

  var normalizedNeeds = data.normalizedKeywords ? data.normalizedKeywords.attentes || [] : []
  var normalizedFears = data.normalizedKeywords ? data.normalizedKeywords.craintes || [] : []
  var hasNormalized = normalizedNeeds.length > 0 || normalizedFears.length > 0

  async function handleAnalyze() {
    if (!sid || analyzing) return
    setAnalyzing(true)
    setAnalyzeMsg('')
    setProgressMessages(['Démarrage de l\'analyse...'])

    try {
      setProgressMessages(function(prev) { return [...prev, 'Analyse des attentes en cours...'] })
      var res = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
      })
      var result = await res.json()
      if (!res.ok) {
        setAnalyzeMsg(result.error || 'Erreur lors de l\'analyse')
        setProgressMessages(function(prev) { return [...prev, 'Erreur: ' + (result.error || 'Analyse échouée')] })
      } else {
        setProgressMessages(function(prev) { return [...prev, 'Analyse terminée avec succès'] })
        setAnalyzeMsg('Analyse terminée avec succès')
        // Recharger les données pour mettre à jour le cloud
        var fresh = await fetch('/api/session/' + encodeURIComponent(sid))
        var freshData = await fresh.json()
        setData(freshData)
      }
    } catch (e) {
      setAnalyzeMsg('Erreur réseau: ' + (e.message || 'inaccessible'))
      setProgressMessages(function(prev) { return [...prev, 'Erreur réseau'] })
    }
    setAnalyzing(false)
    setTimeout(function() {
      setAnalyzeMsg('')
      setProgressMessages([])
    }, 5000)
  }

  function handleExport() {
    if (!data) return
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'resultats-' + sid + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <Head><title>Résultats - Sondage IA Admin</title></Head>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Résultats : {data.label || sid}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Code : <span className="font-mono text-white/70">{sid}</span> &bull; {stats.totalParticipants} participant{stats.totalParticipants !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || stats.totalParticipants === 0}
            className="btn-primary-whole px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Analyse...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analyser
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            className="btn-primary-whole px-4 py-2 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter
          </button>
        </div>
      </div>

      {/* Progress messages */}
      {progressMessages.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <div className="bg-gray-900/95 backdrop-blur border border-white/10 rounded-xl p-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 border-2 border-transilio-electric border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-white">Analyse IA en cours</span>
            </div>
            <div className="space-y-1.5">
              {progressMessages.map(function(msg, i) {
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                    {i === progressMessages.length - 1 ? (
                      <>
                        <svg className="w-3 h-3 text-transilio-electric" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white font-medium">{msg}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{msg}</span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Participants', value: stats.totalParticipants, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
          { label: 'Attentes uniques', value: stats.uniqueNeeds, icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
          { label: 'Craintes uniques', value: stats.uniqueFears, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
          { label: 'Total mentions', value: stats.totalNeedsMentions + stats.totalFearsMentions, icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
        ].map(function (stat, i) {
          return (
            <div key={i} className="glass-surface rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-transilio-electric/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                  </svg>
                </div>
                <span className="text-xs text-white/40">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Word Clouds side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleWordCloud
          data={hasNormalized ? normalizedNeeds : needsData}
          title={hasNormalized ? "Attentes normalisées" : "Attentes des stagiaires"}
          color="#3B82F6"
          normalized={hasNormalized}
        />
        <SimpleWordCloud
          data={hasNormalized ? normalizedFears : fearsData}
          title={hasNormalized ? "Craintes normalisées" : "Craintes des stagiaires"}
          color="#FF5340"
          normalized={hasNormalized}
        />
      </div>

      {/* Raw responses list (collapsible detail) */}
      {(data.responses && data.responses.length > 0) && (
        <div className="mt-8 glass-surface rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Réponses détaillées</h3>
          <div className="space-y-3">
            {data.responses.map(function (response, idx) {
              return (
                <div key={response.id || idx} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-transilio-electric/20 text-white px-2 py-0.5 rounded">
                      {response.id}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(response.submittedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(response.needs || []).map(function (word, i) {
                      return (
                        <span key={'n' + i} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                          {word}
                        </span>
                      )
                    })}
                    {(response.fears || []).map(function (word, i) {
                      return (
                        <span key={'f' + i} className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">
                          {word}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
