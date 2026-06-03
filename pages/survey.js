import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { generatePhoneticCode } from '../lib/generateCode'
import LegalFooter from '../components/Common/LegalFooter'

const STEPS = [
  { id: 1, label: 'Identifiant' },
  { id: 2, label: 'Attentes' },
  { id: 3, label: 'Craintes' },
  { id: 4, label: 'Merci' },
]

export default function SurveyPage() {
  const router = useRouter()
  // ?tenantId=ID et ?session=ID sont obligatoires.
  // Rétrocompat : si ?tenantId est absent (ancien format), on tente
  // d'abord le tenant `transilio` (le seul à avoir des sessions legacy).
  const { session, tenantId: queryTenantId } = router.query
  const tenantId = queryTenantId || 'transilio'
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)
  const [sessionLabel, setSessionLabel] = useState('')
  const [stagiaireCode, setStagiaireCode] = useState('')
  const [isNewParticipant, setIsNewParticipant] = useState(false)
  const [attentes, setAttentes] = useState('')                    // @deprecated — kept for backward compat with existing responses (textarea)
  const [selectedAttentes, setSelectedAttentes] = useState([])
  const [autreAttente, setAutreAttente] = useState('')
  const [attentesOptions, setAttentesOptions] = useState([])
  const [selectedCraintes, setSelectedCraintes] = useState([])
  const [autreCrainte, setAutreCrainte] = useState('')
  const [email, setEmail] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  // emailStatus: null | { kind: 'ok', to: string } | { kind: 'error', message: string }
  const [submitting, setSubmitting] = useState(false)
  const [craintesOptions, setCraintesOptions] = useState([])
  const [error, setError] = useState('')

  // Helper pour les URLs d'API cloisonnées
  const tenantApi = (path = '') => `/api/tenant/${tenantId}${path}`

  // Valider la session au chargement
  useEffect(function () {
    if (!session) {
      setLoading(false)
      return
    }
    fetch(tenantApi('/sondages'))
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data[session]) {
          setSessionValid(true)
          setSessionLabel(data[session].label || '')
        } else {
          setError('Code de sondage invalide')
        }
        setLoading(false)
      })
      .catch(function () {
        setError('Erreur lors de la vérification du sondage')
        setLoading(false)
      })
  }, [session, tenantId])

  // Charger les craintes depuis settings
  useEffect(function () {
    fetch('/api/settings')
      .then(function (res) { return res.json() })
      .then(function (data) {
        setCraintesOptions(data.craintes || [])
        setAttentesOptions(data.attentes || [])
      })
      .catch(function () {})
  }, [])

  // Générer un nouveau code phonétique
  function handleGenerateCode() {
    var code = generatePhoneticCode(5)
    setStagiaireCode(code)
    setIsNewParticipant(true)
  }

  // Toggle une crainte (max 3)
  function toggleCrainte(id) {
    setSelectedCraintes(function (prev) {
      if (prev.includes(id)) {
        return prev.filter(function (c) { return c !== id })
      }
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  // Toggle une attente (max 3)
  function toggleAttente(id) {
    setSelectedAttentes(function (prev) {
      if (prev.includes(id)) {
        return prev.filter(function (c) { return c !== id })
      }
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  // Soumettre les réponses
  async function handleSubmit() {
    if (!stagiaireCode.trim()) return

    setSubmitting(true)
    setError('')

    // Construire les listes needs et fears
    // (séparateurs pour le champ libre : virgule ou retour chariot)
    var needsList = []
    selectedAttentes.forEach(function (id) {
      var opt = attentesOptions.find(function (a) { return a.id === id })
      if (opt) needsList.push(opt.label.toLowerCase())
    })
    if (autreAttente.trim()) {
      var extraNeeds = autreAttente
        .split(/[\n,]+/)
        .filter(function (w) { return w.trim().length > 0 })
        .map(function (w) { return w.trim().toLowerCase() })
      needsList = needsList.concat(extraNeeds)
    }
    // Backward-compat : si un respondent revient avec un `attentes` legacy
    // (champ texte plein) toujours présent, on l'inclut aussi.
    if (attentes && attentes.trim() && selectedAttentes.length === 0 && !autreAttente.trim()) {
      needsList = attentes
        .split(/[\n,]+/)
        .filter(function (w) { return w.trim().length > 0 })
        .map(function (w) { return w.trim().toLowerCase() })
    }

    var fearsList = []
    selectedCraintes.forEach(function (id) {
      var opt = craintesOptions.find(function (c) { return c.id === id })
      if (opt) fearsList.push(opt.label.toLowerCase())
    })
    if (autreCrainte.trim()) {
      // Séparer aussi par virgule ou retour chariot
      var extraFears = autreCrainte
        .split(/[\n,]+/)
        .filter(function (w) { return w.trim().length > 0 })
        .map(function (w) { return w.trim().toLowerCase() })
      fearsList = fearsList.concat(extraFears)
    }

    try {
      var res = await fetch(tenantApi('/session/' + encodeURIComponent(session)), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stagiaireCode.toUpperCase(),
          needs: needsList,
          fears: fearsList,
        }),
      })

      if (!res.ok) {
        var errData = await res.json()
        setError(errData.error || 'Erreur lors de la sauvegarde')
        setSubmitting(false)
        return
      }

      setCurrentStep(4)
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.')
      setSubmitting(false)
    }
  }

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transilio-blue">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Session invalide ou absente
  if (!sessionValid || error && currentStep === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-transilio-blue">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center animate-scale-in">
          <h1 className="text-2xl font-bold text-white mb-4">Sondage IA</h1>
          {error ? (
            <>
              <p className="text-white/70 mb-6">{error}</p>
              <button onClick={function () { router.push('/') }} className="btn-primary">
                Retour à l&apos;accueil
              </button>
            </>
          ) : (
            <>
              <p className="text-white/70 mb-6">Veuillez accéder au sondage via un code de sondage valide.</p>
              <button onClick={function () { router.push('/') }} className="btn-primary">
                Retour à l&apos;accueil
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{STEPS[currentStep - 1].label} - Sondage IA</title>
        <meta name="description" content="Sondage sur l&apos;Intelligence Artificielle" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-transilio-blue">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-transilio-electric/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-transilio-red/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="z-10 w-full max-w-2xl">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map(function (step) {
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={
                      'w-3 h-3 rounded-full transition-colors ' +
                      (currentStep >= step.id ? 'bg-transilio-electric' : 'bg-white/30')
                    } />
                    <span className={'text-xs mt-1 hidden sm:block transition-colors ' +
                      (currentStep >= step.id ? 'text-white/80' : 'text-white/40')}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full">
              <div
                className="bg-transilio-electric h-1 rounded-full transition-all duration-300"
                style={{ width: (currentStep / STEPS.length) * 100 + '%' }}
              />
            </div>
          </div>

          {/* Session info */}
          <div className="text-center mb-6">
            <p className="text-sm text-white/50">Sondage : <span className="text-white/80 font-medium">{sessionLabel}</span></p>
          </div>

          {/* Card */}
          <div className="glass rounded-2xl p-8 shadow-glow">

            {/* ===== ÉTAPE 1 : Code stagiaire ===== */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white mb-2">Bienvenue !</h1>
                  <p className="text-white/70">
                    Avez-vous déjà un code participant ?
                  </p>
                </div>

                {!isNewParticipant ? (
                  <div className="space-y-4">
                    <button
                      onClick={handleGenerateCode}
                      className="btn-primary w-full"
                    >
                      Je suis un nouveau participant
                    </button>

                    <div className="relative flex items-center gap-4 my-2">
                      <div className="flex-1 h-px bg-white/20" />
                      <span className="text-white/40 text-sm whitespace-nowrap">ou</span>
                      <div className="flex-1 h-px bg-white/20" />
                    </div>

                    <div>
                      <label className="label">Votre code participant</label>
                      <input
                        type="text"
                        value={stagiaireCode}
                        onChange={function (e) { setStagiaireCode(e.target.value.toUpperCase()) }}
                        placeholder="Ex: BUDAP"
                        className="input-field"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-transilio-electric/20 border border-transilio-electric/30 rounded-xl p-4 text-center">
                      <p className="text-sm text-white/60 mb-1">Votre code participant</p>
                      <p className="text-2xl font-bold text-white tracking-widest">{stagiaireCode}</p>
                      <p className="text-xs text-white/40 mt-1">Notez-le pour pouvoir retrouver vos réponses</p>
                    </div>

                    <div>
                      <label className="label">Vous pouvez modifier votre code</label>
                      <input
                        type="text"
                        value={stagiaireCode}
                        onChange={function (e) { setStagiaireCode(e.target.value.toUpperCase()) }}
                        placeholder="Votre code participant"
                        className="input-field"
                      />
                    </div>
                  </div>
                )}

                {error && <p className="error-message text-center">{error}</p>}

                <button
                  onClick={async function () {
                    if (!stagiaireCode.trim()) {
                      setError('Veuillez entrer ou générer un code participant')
                      return
                    }
                    setError('')
                    var code = stagiaireCode.toUpperCase().trim()

                    // Vérifier si ce participant a déjà des réponses enregistrées
                    try {
                      var res = await fetch(tenantApi('/session/' + encodeURIComponent(session)))
                      if (res.ok) {
                        var data = await res.json()
                        var existing = (data.responses || []).find(function (r) { return r.id === code })
                        if (existing) {
                          // Recharger les réponses existantes
                          setAttentes('')
                          setAutreAttente('')
                          setSelectedAttentes([])
                          setAutreCrainte('')
                          setSelectedCraintes([])
                          // Restaurer les attentes cochées depuis les labels stockés
                          var preselectedAttentes = []
                          var freeAttentes = []
                          ;(existing.needs || []).forEach(function (needLabel) {
                            var opt = attentesOptions.find(function (a) { return a.label.toLowerCase() === needLabel })
                            if (opt) preselectedAttentes.push(opt.id)
                            else freeAttentes.push(needLabel)
                          })
                          setSelectedAttentes(preselectedAttentes)
                          setAutreAttente(freeAttentes.join(', '))
                          // Restaurer les craintes cochées depuis les labels stockés
                          var preselectedCraintes = []
                          var freeCraintes = []
                          ;(existing.fears || []).forEach(function (fearLabel) {
                            var opt = craintesOptions.find(function (c) { return c.label.toLowerCase() === fearLabel })
                            if (opt) preselectedCraintes.push(opt.id)
                            else freeCraintes.push(fearLabel)
                          })
                          setSelectedCraintes(preselectedCraintes)
                          setAutreCrainte(freeCraintes.join(', '))
                        }
                      }
                    } catch (err) {
      // Pas bloquant, on continue quand même
                    }

                    setCurrentStep(2)
                  }}
                  className="btn-primary w-full"
                  disabled={!stagiaireCode.trim()}
                >
                  Continuer
                </button>
              </div>
            )}

            {/* ===== ÉTAPE 2 : Attentes (checkboxes max 3 + texte) ===== */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">Qu&apos;attendez-vous de l&apos;IA ?</h2>
                  <p className="text-white/70">
                    Choisissez jusqu&apos;à 3 attentes et/ou ajoutez la vôtre.
                  </p>
                </div>

                <div className="space-y-3">
                  {attentesOptions.map(function (opt) {
                    var selected = selectedAttentes.includes(opt.id)
                    var disabled = !selected && selectedAttentes.length >= 3
                    return (
                      <label
                        key={opt.id}
                        className={
                          'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ' +
                          (selected
                            ? 'bg-transilio-electric/20 border border-transilio-electric/40'
                            : disabled
                              ? 'bg-white/5 border border-white/10 opacity-50 cursor-not-allowed'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20')
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={disabled}
                          onChange={function () { toggleAttente(opt.id) }}
                          className="mt-0.5 w-4 h-4 rounded border-white/30 text-transilio-electric focus:ring-transilio-electric bg-transparent"
                        />
                        <span className={'font-medium ' + (selected ? 'text-white' : 'text-white/80')}>
                          {opt.label}
                        </span>
                      </label>
                    )
                  })}
                </div>

                <div>
                  <label className="label">Autre(s) attente(s) ? (optionnel)</label>
                  <input
                    type="text"
                    value={autreAttente}
                    onChange={function (e) { setAutreAttente(e.target.value) }}
                    placeholder="Autres attentes (séparez par des virgules)..."
                    className="input-field"
                  />
                </div>

                <p className="text-xs text-white/40">
                  {selectedAttentes.length}/3 attentes sélectionnées
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={function () { setCurrentStep(1) }}
                    className="btn-secondary flex-1"
                  >
                    Retour
                  </button>
                  <button
                    onClick={function () {
                      if (selectedAttentes.length === 0 && !autreAttente.trim()) {
                        setError('Veuillez sélectionner au moins une attente ou en saisir une')
                        return
                      }
                      setError('')
                      setCurrentStep(3)
                    }}
                    className="btn-primary flex-1"
                  >
                    Continuer
                  </button>
                </div>

                {error && <p className="error-message text-center">{error}</p>}
              </div>
            )}

            {/* ===== ÉTAPE 3 : Craintes (checkboxes max 3 + texte) ===== */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">Quelles craintes avez-vous ?</h2>
                  <p className="text-white/70">
                    Choisissez jusqu&apos;à 3 craintes et/ou ajoutez la vôtre.
                  </p>
                </div>

                <div className="space-y-3">
                  {craintesOptions.map(function (opt) {
                    var selected = selectedCraintes.includes(opt.id)
                    var disabled = !selected && selectedCraintes.length >= 3
                    return (
                      <label
                        key={opt.id}
                        className={
                          'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ' +
                          (selected
                            ? 'bg-transilio-electric/20 border border-transilio-electric/40'
                            : disabled
                              ? 'bg-white/5 border border-white/10 opacity-50 cursor-not-allowed'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20')
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={disabled}
                          onChange={function () { toggleCrainte(opt.id) }}
                          className="mt-0.5 w-4 h-4 rounded border-white/30 text-transilio-electric focus:ring-transilio-electric bg-transparent"
                        />
                        <span className={'font-medium ' + (selected ? 'text-white' : 'text-white/80')}>
                          {opt.label}
                        </span>
                      </label>
                    )
                  })}
                </div>

                <div>
                  <label className="label">Autre crainte ? (optionnel)</label>
                  <input
                    type="text"
                    value={autreCrainte}
                    onChange={function (e) { setAutreCrainte(e.target.value) }}
                    placeholder="Autres craintes (séparez par des virgules)..."
                    className="input-field"
                  />
                </div>

                <p className="text-xs text-white/40">
                  {selectedCraintes.length}/3 craintes sélectionnées
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={function () { setCurrentStep(2) }}
                    className="btn-secondary flex-1"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-accent flex-1"
                  >
                    {submitting ? 'Envoi en cours...' : 'Envoyer mes réponses'}
                  </button>
                </div>

                {error && <p className="error-message text-center">{error}</p>}
              </div>
            )}

            {/* ===== ÉTAPE 4 : Merci ! ===== */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-scale-in text-center">
                <div className="text-6xl mb-2">&#10003;</div>
                <h2 className="text-3xl font-bold text-white mb-2">Merci !</h2>
                <p className="text-white/70">
                  Vos réponses ont bien été enregistrées.
                </p>

                {/* Récapitulatif */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left mt-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Récapitulatif de vos réponses</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Code participant :</span>
                      <span className="text-white font-bold tracking-wider">{stagiaireCode.toUpperCase()}</span>
                    </div>

                    <div className="border-t border-white/10 pt-3">
                      <span className="text-white/60 text-sm block mb-2">Attentes :</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedAttentes.map(function (id) {
                          var opt = attentesOptions.find(function (a) { return a.id === id })
                          return opt ? (
                            <span key={id} className="px-3 py-1 bg-transilio-electric/20 text-white text-sm rounded-lg">
                              {opt.label}
                            </span>
                          ) : null
                        })}
                        {autreAttente.trim() && autreAttente.split(/[\n,]+/).filter(function (w) { return w.trim().length > 0 }).map(function (word, i) {
                          return (
                            <span key={'aa' + i} className="px-3 py-1 bg-transilio-electric/20 text-white text-sm rounded-lg">
                              {word.trim()}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3">
                      <span className="text-white/60 text-sm block mb-2">Craintes :</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedCraintes.map(function (id) {
                          var opt = craintesOptions.find(function (c) { return c.id === id })
                          return opt ? (
                            <span key={id} className="px-3 py-1 bg-transilio-red/20 text-white text-sm rounded-lg">
                              {opt.label}
                            </span>
                          ) : null
                        })}
                        {autreCrainte.trim() && autreCrainte.split(/[\n,]+/).filter(function (w) { return w.trim().length > 0 }).map(function (word, i) {
                          return (
                            <span key={'ac' + i} className="px-3 py-1 bg-transilio-red/20 text-white text-sm rounded-lg">
                              {word.trim()}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email optionnel */}
                <div className="text-left">
                  <label className="label">Adresse email (optionnel)</label>
                  <p className="text-xs text-white/40 mb-2">
                    Recevez un récapitulatif de vos réponses par email.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={function (e) {
                        setEmail(e.target.value)
                        if (emailStatus) setEmailStatus(null)
                      }}
                      placeholder="votre@email.com"
                      readOnly={emailStatus && emailStatus.kind === 'ok'}
                      className="input-field flex-1"
                    />
                    <button
                      onClick={async function () {
                        if (!email.trim() || emailSending) return
                        setEmailSending(true)
                        setEmailStatus(null)
                        try {
                          var res = await fetch(tenantApi('/session/' + encodeURIComponent(session) + '/email'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              code: stagiaireCode.toUpperCase(),
                              email: email.trim(),
                            }),
                          })
                          var data = await res.json().catch(function () { return {} })
                          if (res.ok) {
                            setEmailStatus({ kind: 'ok', to: email.trim() })
                            // Auto-efface après 6s
                            setTimeout(function () {
                              setEmailStatus(function (cur) { return cur && cur.kind === 'ok' ? null : cur })
                            }, 6000)
                          } else {
                            var msg = data.error === 'smtp_not_configured'
                              ? "L'envoi d'email n'est pas encore configuré sur cette installation. Vous pouvez imprimer cette page."
                              : (data.message || data.error || "Erreur lors de l'envoi de l'email")
                            setEmailStatus({ kind: 'error', message: msg })
                          }
                        } catch (e) {
                          setEmailStatus({ kind: 'error', message: 'Erreur réseau. Réessayez.' })
                        } finally {
                          setEmailSending(false)
                        }
                      }}
                      disabled={!email.trim() || emailSending}
                      className="btn-secondary whitespace-nowrap"
                    >
                      {emailSending ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                  {emailStatus && emailStatus.kind === 'ok' && (
                    <p className="text-green-400 text-sm mt-2">
                      ✓ Récapitulatif envoyé à {emailStatus.to}
                    </p>
                  )}
                  {emailStatus && emailStatus.kind === 'error' && (
                    <p className="text-transilio-red text-sm mt-2">
                      ⚠ {emailStatus.message}
                    </p>
                  )}
                </div>

                {/* Texte de fin — le sondé peut fermer la page */}
                <p className="text-white/50 text-sm mt-6 text-center">
                  Vous pouvez fermer cette page.
                </p>
              </div>
            )}
          </div>
        </div>
        <LegalFooter className="mt-6" />
      </div>
    </>
  )
}
