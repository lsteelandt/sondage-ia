/**
 * Section "Comment ça marche" : 3 étapes.
 */
const STEPS = [
  {
    number: '01',
    title: 'Créez votre sondage',
    description:
      'Saisissez votre email professionnel (⚠️ gmail, orange, Outlook... ne sont pas acceptés). Vous recevez un lien magique par email pour accéder à votre espace de création de sondages.',
    icon: '✨',
  },
  {
    number: '02',
    title: 'Partagez le lien à vos équipes',
    description:
      'Le sondage est anonyme, prend 5 minutes, et fonctionne sur tous les appareils. Aucune installation requise.',
    icon: '📤',
  },
  {
    number: '03',
    title: 'Analysez les résultats',
    description:
      'Notre IA synthétise les réponses en un nuage de mots thématiques. Identifiez les attentes, les craintes, et les leviers d&apos;action.',
    icon: '🎯',
  },
]

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-20 md:py-28 px-4 sm:px-6 border-t border-white/10"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comment ça marche
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Trois étapes pour comprendre la maturité de votre organisation
            face à l&apos;IA, sans aucune friction.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="card p-8 relative overflow-hidden group"
            >
              <div className="absolute top-4 right-4 text-5xl font-bold text-white/5 group-hover:text-white/10 transition-colors">
                {step.number}
              </div>
              <div className="text-3xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p
                className="text-white/60 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: step.description }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
