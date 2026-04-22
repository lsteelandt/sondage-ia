import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '../../components/Admin/AdminLayout'

export default function SessionsPage() {
  var formations = useState({})
  var setFormations = formations[1]
  formations = formations[0]

  var loading = useState(true)
  var setLoading = loading[1]
  loading = loading[0]

  var newLabel = useState('')
  var setNewLabel = newLabel[1]
  newLabel = newLabel[0]

  var creating = useState(false)
  var setCreating = creating[1]
  creating = creating[0]

  var error = useState('')
  var setError = error[1]
  error = error[0]

  var copiedId = useState(null)
  var setCopiedId = copiedId[1]
  copiedId = copiedId[0]

  useEffect(function () {
    loadFormations()
  }, [])

  function loadFormations() {
    fetch('/api/sessions')
      .then(function (res) { return res.json() })
      .then(function (data) {
        setFormations(data)
        setLoading(false)
      })
      .catch(function () {
        setError('Erreur lors du chargement')
        setLoading(false)
      })
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newLabel.trim()) return
    setCreating(true)
    setError('')

    try {
      var res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() }),
      })
      if (!res.ok) {
        var data = await res.json()
        setError(data.error || 'Erreur')
        setCreating(false)
        return
      }
      setNewLabel('')
      setCreating(false)
      loadFormations()
    } catch {
      setError('Erreur réseau')
      setCreating(false)
    }
  }

  async function handleDelete(sessionId, label) {
    if (!confirm('Supprimer la formation "' + label + '" ? Cette action est irréversible.')) {
      return
    }

    try {
      var res = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId }),
      })
      if (res.ok) {
        loadFormations()
      }
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  function handleCopy(sessionId) {
    var url = window.location.origin + '/survey?session=' + sessionId
    navigator.clipboard.writeText(url).then(function () {
      setCopiedId(sessionId)
      setTimeout(function () { setCopiedId(null) }, 2000)
    })
  }

  function formatDate(iso) {
    if (!iso) return ''
    var d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  var entries = Object.entries(formations)

  return (
    <AdminLayout>
      <Head>
        <title>Formations - Sondage IA Admin</title>
      </Head>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Formations</h1>
          <p className="text-sm text-white/50 mt-1">Gérez vos sessions de formation et leurs accès</p>
        </div>
        <div className="glass-surface rounded-xl px-6 py-4">
          <p className="text-3xl font-bold text-white">{entries.length}</p>
          <p className="text-xs text-white/40">formation{entries.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* New formation form */}
      <div className="glass-surface rounded-xl p-6">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <input
              type="text"
              value={newLabel}
              onChange={function (e) { setNewLabel(e.target.value) }}
              placeholder="Nom de la nouvelle formation"
              className="input-field pl-10"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newLabel.trim()}
            className="btn-primary-whole hover-scale transition-transform duration-200"
          >
            {creating ? (
              <>
                Création...
                <svg className="w-4 h-4 ml-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </>
            ) : (
              <>
                Créer la formation
                <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-transilio-red/20 border border-transilio-red/30 text-white rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-transilio-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass-surface p-12 flex justify-center items-center">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="glass-surface p-12 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-white/50 mb-2">Aucune formation créée</p>
          <p className="text-sm text-white/30">Créez votre première formation pour commencer</p>
        </div>
      )}

      {/* Formation cards */}
      <div className="space-y-4">
        {entries.map(function (entry) {
          var id = entry[0]
          var info = entry[1]
          var hasParticipants = (info.participantCount || 0) > 0
          return (
            <div key={id} className="glass-surface rounded-xl p-6 hover:bg-white/[0.15] transition-colors hover:shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Info Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-transilio-electric/30 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="font-semibold text-white text-lg truncate">{info.label}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">{id}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{info.participantCount || 0} participant{(info.participantCount || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(info.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {hasParticipants ? (
                    <a
                      href={'/admin/resultats?session=' + id}
                      className="btn-primary-whole px-4 py-2 text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6M9 19h12M9 19H4m12-7v6m0-6a2 2 0 012-2h3a2 2 0 012 2v6m-7-7v6m0-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6" />
                      </svg>
                      Voir résultats
                    </a>
                  ) : (
                    <button
                      disabled={true}
                      className="inline-flex items-center justify-center px-4 py-2 bg-white/10 text-white/40 text-sm font-medium rounded-xl cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6M9 19h12M9 19H4m12-7v6m0-6a2 2 0 012-2h3a2 2 0 012 2v6m-7-7v6m0-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6" />
                      </svg>
                      Aucun résultat
                    </button>
                  )}
                  <button
                    onClick={function () { handleDelete(id, info.label) }}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-transilio-red hover:bg-transilio-red/10 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Supprimer
                  </button>
                </div>
              </div>

              {/* Survey URL with copy */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 shrink-0">Lien participants :</span>
                  <div className="flex-1 min-w-0 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-10">
                    <code className="text-xs text-white/60 truncate flex-1 font-mono">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/survey?session={id}
                    </code>
                    <button
                      onClick={function () { handleCopy(id) }}
                      className={
                        'shrink-0 inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-xl transition-all duration-200 ' +
                        (copiedId === id
                          ? 'bg-transilio-electric text-white'
                          : 'bg-white/10 text-white hover:bg-white/20')
                      }
                    >
                      {copiedId === id ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Copié
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 16a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-2M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 16a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-2" />
                          </svg>
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}