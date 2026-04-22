// pages/survey.js
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState } from 'react'

const SURVEY_STEPS = [
  { id: 'welcome', label: 'Bienvenue', component: 'Welcome' },
  { id: 'info', label: 'Informations', component: 'InfoForm' },
  { id: 'craintes', label: 'Craintes', component: 'FearSelector' },
  { id: 'wordcloud', label: 'Nuage de mots', component: 'SimpleWordCloud' },
  { id: 'review', label: 'Revue', component: 'ReviewForm' },
  { id: 'complete', label: 'Terminé', component: 'Completion' }
]

export default function SurveyPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState('welcome')
  const [formData, setFormData] = useState({
    id: null,
    surname: '',
    name: '',
    fear: '',
    fears: '',
    wordcloud: '',
    feedback: ''
  })

  const handleNext = () => {
    const nextStepIndex = SURVEY_STEPS.findIndex(s => s.id === currentStep)
    if (nextStepIndex < SURVEY_STEPS.length - 1) {
      setCurrentStep(SURVEY_STEPS[nextStepIndex + 1].id)
      localStorage.setItem('surveyStep', currentStep)
    }
  }

  const handleBack = () => {
    const prevStepIndex = SURVEY_STEPS.findIndex(s => s.id === currentStep)
    if (prevStepIndex > 0) {
      setCurrentStep(SURVEY_STEPS[prevStepIndex - 1].id)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const url = process.env.NEXT_PUBLIC_API_URL + '/api/session'
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      router.push('/survey-complete')
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    }
  }

  const handleInfoChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFearChange = (value) => {
    const selectedFear = typeof value === 'string' ? value : value.label
    setFormData(prev => ({ ...prev, fear: selectedFear, fears: selectedFear }))
  }

  const handleWordCloudChange = (value) => {
    setFormData(prev => ({ ...prev, wordcloud: value }))
  }

  const handleReviewChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <>
      <Head>
        <title>{SURVEY_STEPS.find(s => s.id === currentStep).label} - Sondage Transilio</title>
        <meta name="description" content="Participez au sondage Transilio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in relative overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-transilio-electric/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-transilio-red/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="glass rounded-2xl p-8 shadow-glow max-w-2xl w-full">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {SURVEY_STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    currentStep === step.id ? 'bg-transilio-electric' :
                    index < SURVEY_STEPS.findIndex(s => s.id === currentStep) ? 'bg-transilio-electric' : 'bg-gray-600'
                  }`} />
                  <span className="text-xs text-white/60 mt-1 hidden sm:block">{step.label}</span>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-700 h-1 rounded-full">
              <div
                className="bg-transilio-electric h-1 rounded-full transition-all duration-300"
                style={{ width: `${((SURVEY_STEPS.findIndex(s => s.id === currentStep) + 1) / SURVEY_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="text-center">
            {currentStep === 'welcome' && (
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-white mb-4">Bienvenue sur le sondage Transilio</h1>
                <p className="text-lg text-white/80 max-w-md mx-auto">
                  Ce questionnaire est conçu pour améliorer nos produits et services. Vos réponses anonymes nous aideront à mieux vous connaître.
                </p>
                <button
                  onClick={handleNext}
                  className="btn-primary w-full"
                >
                  Commencer
                </button>
              </div>
            )}

            {currentStep === 'info' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-3xl font-bold text-white mb-6">Vos informations</h2>

                <div className="space-y-4">
                  <div>
                    <label className="label">Noms de famille</label>
                    <input
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInfoChange}
                      placeholder="Votre nom de famille"
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label">Prénom</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInfoChange}
                      placeholder="Votre prénom"
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-secondary flex-1"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    Continuer
                  </button>
                </div>
              </form>
            )}

            {currentStep === 'craintes' && (
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white mb-6">Quelles craintes vous accompagnent ?</h2>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {['Anxiété', 'Perte de contrôle', 'Isolement', 'Insécurité'].map((fear) => (
                    <button
                      key={fear}
                      onClick={() => handleFearChange(fear)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        formData.fear === fear
                          ? 'bg-transilio-electric text-white shadow-lg'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      <div className="font-semibold">{fear}</div>
                    </button>
                  ))}
                </div>

                <textarea
                  value={formData.fears}
                  onChange={(e) => setFormData(prev => ({ ...prev, fears: e.target.value }))}
                  placeholder="Décrivez vos craintes..."
                  rows={3}
                  className="input-field"
                />

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-secondary flex-1"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-primary flex-1"
                    disabled={!formData.fears}
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'wordcloud' && (
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white mb-6">Nuage de mots</h2>

                <p className="text-white/80 mb-4">
                  Associez une idée à la peur sélectionnée ci-dessus.
                </p>

                {formData.fear && (
                  <>
                    <div className="p-4 bg-white/10 rounded-xl mb-4">
                      <div className="text-xs text-white/60 mb-1">
                        {formData.fear === 'Anxiété' && 'Ex: Je suis angoissé à l\'idée de'}
                        {formData.fear === 'Perte de contrôle' && 'Ex: J\'ai peur de perdre le contrôle sur'}
                        {formData.fear === 'Isolement' && 'Ex: Je crains de perdre mes relations'}
                        {formData.fear === 'Insécurité' && 'Ex: Je crains de'}
                      </div>
                      <div className="font-semibold text-white">
                        {formData.fear === 'Anxiété' && 'm'}
                        {formData.fear === 'Perte de contrôle' && 't'}
                        {formData.fear === 'Isolement' && 'r'}
                        {formData.fear === 'Insécurité' && 'n'}
                      </div>
                    </div>

                    <textarea
                      value={formData.wordcloud}
                      onChange={(e) => handleWordCloudChange(e.target.value)}
                      placeholder="Ajoutez une idée..."
                      rows={4}
                      className="input-field"
                    />

                    <button
                      onClick={() => handleWordCloudChange(formData.wordcloud + ' - ' + formData.fear)}
                      className="btn-primary w-full"
                    >
                      Sauvegarder
                    </button>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-secondary flex-1"
                  >
                    Retour
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white mb-6">Revue finale</h2>

                <div className="p-4 bg-white/5 rounded-xl mb-4">
                  <div className="text-sm text-white/60 mb-2">Résultats :</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/80">Nom :</span>
                      <span className="text-white font-medium">{formData.surname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Prénom :</span>
                      <span className="text-white font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Crain :</span>
                      <span className="text-white font-medium">{formData.fear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Mot :</span>
                      <span className="text-white font-medium">{formData.wordcloud}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Commentaires (optionnel)</label>
                  <textarea
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleReviewChange}
                    placeholder="Avez-vous des remarques ou suggestions ?"
                    rows={3}
                    className="input-field"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-secondary flex-1"
                  >
                    Modifier
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="btn-primary flex-1 btn-accent"
                  >
                    Valider
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="space-y-4 animate-scale-in">
                <div className="text-6xl mb-4">✓</div>
                <h2 className="text-3xl font-bold text-white mb-4">Terminé !</h2>
                <p className="text-lg text-white/80">
                  Merci pour votre participation. Votre contribution nous aide à améliorer nos produits et services.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="btn-primary w-full mt-6"
                >
                  Retour à l\'accueil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}