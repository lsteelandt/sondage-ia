import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AdminLayout from '../../components/Admin/AdminLayout'
import SimpleWordCloud from '../../components/Survey/SimpleWordCloud'

function buildKeywordMap(stagiaires, field) {
  var map = {}
  Object.values(stagiaires).forEach(function (s) {
    ;(s[field] || []).forEach(function (kw) {
      map[kw] = (map[kw] || 0) + 1
    })
  })
  return map
}

function totalKeywords(map) {
  return Object.values(map).reduce(function (sum, c) { return sum + c }, 0)
}

export default function ResultatsPage() {
  var router = useRouter()
  var sessionId = router.query.session

  var data = useState(null)
  var setData = data[1]
  data = data[0]

  var loading = useState(true)
  var setLoading = loading[1]
  loading = loading[0]

  var error = useState('')
  var setError = error[1]
  error = error[0]

  useEffect(function () {
    if (!sessionId) return
    setLoading(true)
    fetch('/api/session/' + sessionId)
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
  }, [sessionId])

  function handleExport() {
    if (!data) return
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'keywords-' + sessionId + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!sessionId) {
    return (
      <AdminLayout>
        <Head><title>Résultats - Sondage IA Admin</title></Head>
        <p className="text-gray-400 text-center py-8">
          Aucune formation sélectionnée.{' '}
          <a href="/admin/sessions" className="text-primary-600 underline">Voir les formations</a>
        </p>
      </AdminLayout>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <Head><title>Résultats - Sondage IA Admin</title></Head>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <Head><title>Résultats - Sondage IA Admin</title></Head>
        <p className="text-red-600 text-center py-8">{error}</p>
      </AdminLayout>
    )
  }

  var stagiaires = data.stagiaires || {}
  var keywords = data.keywords || {}
  var info = data.info || {}

  var attentesMap = buildKeywordMap(stagiaires, 'attentes')
  var craintesMap = buildKeywordMap(stagiaires, 'craintes')

  var totalKw = totalKeywords(keywords)
  var uniqueKw = Object.keys(keywords).length
  var totalStagiaires = Object.keys(stagiaires).length

  return (
    <AdminLayout>
      <Head><title>Résultats - {info.label || 'Formation'} - Sondage IA Admin</title></Head>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">{info.label || 'Formation'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Code : <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{sessionId}</span>
        </p>
      </div>

      {/* Word clouds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SimpleWordCloud data={attentesMap} title="Attentes des stagiaires" />
        <SimpleWordCloud data={craintesMap} title="Craintes des stagiaires" />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{totalKw}</p>
          <p className="text-xs text-gray-500 mt-1">Mots-clés total</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{uniqueKw}</p>
          <p className="text-xs text-gray-500 mt-1">Mots-clés uniques</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{totalStagiaires}</p>
          <p className="text-xs text-gray-500 mt-1">Stagiaires</p>
        </div>
      </div>

      {/* Export */}
      <div className="text-right">
        <button
          onClick={handleExport}
          className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-100 transition"
        >
          Exporter les données (JSON)
        </button>
      </div>
    </AdminLayout>
  )
}
