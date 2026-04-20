import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function SurveyPage() {
  const router = useRouter()
  const { session: sessionId } = router.query

  const [currentStep, setCurrentStep] = useState(0)
  const [stagiaireCode, setStagiaireCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [sessionInput, setSessionInput] = useState('')
  const [attentes, setAttentes] = useState('')
  const [selectedCraintes, setSelectedCraintes] = useState([])
  const [autreCrainte, setAutreCrainte] = useState('')
  const [craintesOptions, setCraintesOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionValid, setSessionValid] = useState(null)

  // Wait for router to be ready
  useEffect(function () {
    if (!router.isReady) return
    if (sessionId) {
      setCurrentStep(1)
    }
  }, [router.isReady, sessionId])

  // Fetch craintes options when entering step 3
  useEffect(function () {
    if (currentStep === 3 && craintesOptions.length === 0) {
      fetch('/api/craintes')
        .then(function (res) { return res.json() })
        .then(function (data) {
          setCraintesOptions(data.craintes || [])
        })
        .catch(function () { setCraintesOptions([]) })
    }
  }, [currentStep])

  // Step 0: Submit session code
  function handleSessionSubmit(e) {
    e.preventDefault()
    const code = sessionInput.trim()
    if (!code) return
    router.push('/survey?session=' + code)
  }

  // Step 1: Generate new code
  async function handleGenerate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/session/' + sessionId + '/stagiaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setStagiaireCode(data.code)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  // Step 1: Verify existing code
  async function handleVerify() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/session/' + sessionId + '/stagiaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: inputCode.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      if (!data.exists) {
        setError('Code non reconnu. Vérifiez ou créez un nouveau code.')
        setLoading(false)
        return
      }
      setStagiaireCode(data.code)
      setCurrentStep(2)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  // Step 2: Submit attentes
  function handleAttentesSubmit(e) {
    e.preventDefault()
    setCurrentStep(3)
  }

  // Toggle a crainte checkbox
  function toggleCrainte(id) {
    setSelectedCraintes(function (prev) {
      return prev.includes(id)
        ? prev.filter(function (c) { return c !== id })
        : prev.concat([id])
    })
  }

  // Step 3: Submit craintes and save everything
  async function handleFinalSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    var allCraintes = selectedCraintes.slice()
    if (autreCrainte.trim()) {
      allCraintes.push(autreCrainte.trim())
    }

    // Convert attentes text to keywords (split by commas, semicolons, newlines, trim)
    var attentesKeywords = attentes
      .split(/[,;\n]+/)
      .map(function (s) { return s.trim() })
      .filter(function (s) { return s.length > 0 })

    try {
      const res = await fetch('/api/session/' + sessionId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stagiaireId: stagiaireCode,
          attentes: attentesKeywords,
          craintes: allCraintes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setCurrentStep(4)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  // Progress dots
  function ProgressDots() {
    var steps = [1, 2, 3]
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map(function (step) {
          var isActive = step === currentStep
          var isDone = step < currentStep
          return (
            <div
              key={step}
              className={
                'rounded-full transition-all duration-300 ' +
                (isActive
                  ? 'w-8 h-3 bg-indigo-600'
                  : isDone
                  ? 'w-3 h-3 bg-indigo-400'
                  : 'w-3 h-3 bg-gray-300')
              }
            />
          )
        })}
      </div>
    )
  }

  // ---- STEP 0: No session ----
  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sondage IA</h1>
            <p className="text-gray-500">Entrez le code de votre session</p>
          </div>
          <form onSubmit={handleSessionSubmit} className="space-y-4">
            <input
              type="text"
              value={sessionInput}
              onChange={function (e) { setSessionInput(e.target.value) }}
              placeholder="Code session"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              disabled={!sessionInput.trim()}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continuer
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ---- STEP 4: Merci ----
  if (currentStep === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci !</h1>
          <p className="text-gray-500">Vos r&eacute;ponses ont &eacute;t&eacute; enregistr&eacute;es.</p>
          {stagiaireCode && (
            <p className="mt-4 text-sm text-gray-400">
              Votre code : <span className="font-mono font-bold text-gray-600">{stagiaireCode}</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  // ---- STEPS 1-3: Wizard with progress ----
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ProgressDots />

        {/* Step 1: Stagiaire code */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Avez-vous un code stagiaire ?</h2>
              <p className="text-sm text-gray-500">Si vous avez d&eacute;j&agrave; particip&eacute;, entrez votre code.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            {!stagiaireCode ? (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={function (e) { setInputCode(e.target.value.toUpperCase()) }}
                    placeholder="Votre code stagiaire"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg uppercase tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    maxLength={10}
                  />
                  <button
                    onClick={handleVerify}
                    disabled={!inputCode.trim() || loading}
                    className="w-full mt-3 py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'V&eacute;rification...' : 'Continuer'}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-gray-50 text-gray-400">ou</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 px-4 border-2 border-indigo-600 text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  Nouveau participant
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-green-700 mb-2">Votre code personnel</p>
                  <p className="text-3xl font-mono font-bold text-green-800 tracking-widest">{stagiaireCode}</p>
                  <p className="text-xs text-green-600 mt-2">Notez ce code pour pouvoir revenir</p>
                </div>
                <button
                  onClick={function () { setCurrentStep(2) }}
                  className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Commencer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Attentes */}
        {currentStep === 2 && (
          <form onSubmit={handleAttentesSubmit} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Qu&apos;attendez-vous comme aide de l&apos;IA ?
              </h2>
              <p className="text-sm text-gray-500">
                D&eacute;crivez vos attentes. S&eacute;parez les id&eacute;es par des virgules.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            <textarea
              value={attentes}
              onChange={function (e) { setAttentes(e.target.value) }}
              placeholder="Ex : gain de temps, aide à la rédaction, automatisation des tâches répétitives..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={5}
              autoFocus
            />

            <button
              type="submit"
              disabled={!attentes.trim()}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </form>
        )}

        {/* Step 3: Craintes */}
        {currentStep === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Quelles craintes vous g&eacute;n&egrave;re l&apos;IA ?
              </h2>
              <p className="text-sm text-gray-500">Cochez les craintes qui vous concernent.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            <div className="space-y-2">
              {craintesOptions.map(function (opt) {
                var checked = selectedCraintes.indexOf(opt.id) >= 0
                return (
                  <label
                    key={opt.id}
                    className={
                      'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ' +
                      (checked
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={function () { toggleCrainte(opt.id) }}
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span className={'text-sm ' + (checked ? 'text-indigo-900 font-medium' : 'text-gray-700')}>
                      {opt.label}
                    </span>
                  </label>
                )
              })}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Autre :</label>
              <input
                type="text"
                value={autreCrainte}
                onChange={function (e) { setAutreCrainte(e.target.value) }}
                placeholder="Pr&eacute;cisez si n&eacute;cessaire..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={selectedCraintes.length === 0 && !autreCrainte.trim()}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Enregistrement...' : 'Terminer'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
