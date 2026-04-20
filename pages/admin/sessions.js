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

      <h1 className="text-xl font-bold text-gray-800 mb-6">Formations</h1>

      {/* New formation form */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newLabel}
          onChange={function (e) { setNewLabel(e.target.value) }}
          placeholder="Nom de la formation"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={creating || !newLabel.trim()}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 transition"
        >
          {creating ? 'Création...' : 'Créer'}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <p className="text-gray-400 text-center py-8">Aucune formation créée</p>
      )}

      {/* Formation cards */}
      <div className="space-y-4">
        {entries.map(function (entry) {
          var id = entry[0]
          var info = entry[1]
          return (
            <div key={id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-800">{info.label}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Code : <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{id}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {info.stagiaireCount || 0} stagiaire{(info.stagiaireCount || 0) !== 1 ? 's' : ''} — {formatDate(info.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <a
                    href={'/admin/resultats?session=' + id}
                    className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                  >
                    Voir résultats
                  </a>
                  <button
                    onClick={function () { handleDelete(id, info.label) }}
                    className="text-sm px-3 py-1.5 text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {/* Survey URL with copy */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-400 shrink-0">Lien participants :</span>
                <code className="text-xs bg-gray-50 border px-2 py-1 rounded truncate flex-1 min-w-0">
                  /survey?session={id}
                </code>
                <button
                  onClick={function () { handleCopy(id) }}
                  className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 transition shrink-0"
                >
                  {copiedId === id ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
