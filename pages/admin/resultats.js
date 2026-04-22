import { use } from 'react'
import Head from 'next/head'
import AdminLayout from '../../components/Admin/AdminLayout'
import SimpleWordCloud from '../../components/Survey/SimpleWordCloud'

export default async function ResultatsPage(props) {
  const { authenticated } = props

  var mounted = use([false])
  var setMounted = mounted[1]
  mounted = mounted[0]

  var sidState = use([''])
  var setSid = sidState[1]
  sidState = sidState[0]

  var data = use([null])
  var setData = data[1]
  data = data[0]

  var loading = use([true])
  var setLoading = loading[1]
  loading = loading[0]

  var error = use([''])
  var setError = error[1]
  error = error[0]

  var formations = use([[]])
  var setFormations = formations[1]
  formations = formations[0]

  useEffect(function () {
    var params = new URLSearchParams(window.location.search)
    var s = params.get('session') || ''
    setSid(s)
    setMounted(true)
  }, [])

  useEffect(function () {
    if (!mounted) return

    // Charger les formations depuis l'API /api/sessions
    fetch('/api/sessions')
      .then(function (res) {
        if (!res.ok) throw new Error('Erreur chargement sessions')
        return res.json()
      })
      .then(function (sessions) {
        var formatted = {}
        sessions.forEach(function (s) {
          formatted[s.id] = s.title
        })
        setFormations(formatted)
      })
      .catch(function (e) {
        console.error('Erreur chargement sessions:', e)
      })

    if (!sidState) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch('/api/session/' + encodeURIComponent(sidState))
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
  }, [mounted, sidState])

  function handleExport() {
    if (!data) return
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'keywords-' + sidState + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Server + first client render: always show loader (prevents hydration mismatch)
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
  if (!sidState) {
    var entries = Object.entries(formations)
    return (
      <AdminLayout>
        <Head><title>Résultats - Sondage IA Admin</title></Head>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Résultats par formation</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map(function (e) {
              var id = e[0]
              var title = e[1]
              return (
                <div
                  key={id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick=function () {
                    setSid(id)
                  }
                >
                  <h3 className="font-medium">{title}</h3>
                </div>
              )
            })}
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Session selected: show results with loader on error
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

  if (error) {
    return (
      <AdminLayout>
        <Head><title>Résultats - Sondage IA Admin</title></Head>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-xl text-red-600 mb-4">{error}</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick=function () {
                window.history.back()
              }
            >
              Retour
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Success: render the results
  return (
    <AdminLayout>
      <Head><title>Résultats - Sondage IA Admin</title></Head>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Résultats : {data.survey?.title || data.survey?.name || sidState}
            </h1>
            <p className="text-gray-600">
              Participants : {data.survey?.participants?.length || 0}
            </p>
          </div>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            onClick={handleExport}
            disabled={!data}
          >
            Exporter
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cartes des mots-clés</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Étudiant</span>
                <span className="text-xs text-gray-500">
                  {data.survey?.participants?.find(p => p.role === 'stagiaire')?.name || '-'}
                </span>
              </div>
              {data.survey?.wordclouds?.find(c => c.type === 'stagiaire') && (
                <div className="mb-6">
                  <SimpleWordCloud
                    cloud={data.survey.wordclouds.find(c => c.type === 'stagiaire')}
                  />
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Formateur</span>
                <span className="text-xs text-gray-500">
                  {data.survey?.participants?.find(p => p.role === 'formateur')?.name || '-'}
                </span>
              </div>
              {data.survey?.wordclouds?.find(c => c.type === 'formateur') && (
                <div>
                  <SimpleWordCloud
                    cloud={data.survey.wordclouds.find(c => c.type === 'formateur')}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Détails du sondage</h2>
            {data.survey?.instructions && (
              <div className="mb-4 text-sm text-gray-600">
                <strong>Instructions :</strong>
                <p>{data.survey.instructions}</p>
              </div>
            )}
            {data.survey?.questions && (
              <div>
                <h3 className="text-sm font-medium mb-2">Questions</h3>
                <ul className="space-y-2 text-sm">
                  {data.survey.questions.map(function (q) {
                    return (
                      <li key={q.id} className="flex justify-between">
                        <span>{q.text || 'Question'}</span>
                        <span className="text-gray-500">
                          {q.type === 'cloud' ? 'Mots-clés' : q.type === 'yesno' ? 'Oui/Non' : 'Texte'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
