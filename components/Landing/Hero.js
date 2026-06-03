/**
 * Hero de la landing : titre, sous-titre, CTA principal.
 * Le CTA ouvre la modale unifiée d'accès (gérée par la page parente).
 */
export default function Hero({ onCreateClick }) {
  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center animate-fade-in">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Découvrez comment vos équipes perçoivent{' '}
          <span className="bg-gradient-to-r from-transilio-red to-transilio-electric bg-clip-text text-transparent">
            l&apos;intelligence artificielle
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
          Un sondage anonyme de vos collaborateurs réalisé en 5 minutes.
          Des résultats synthétisés par IA pour identifier leurs attentes
          et leurs craintes à l&apos;égard de l&apos;intelligence artificielle.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={onCreateClick}
            className="btn-accent px-8 py-4 text-lg animate-glow-pulse"
          >
            J'accède à mon application de sondage
          </button>
          <a
            href="#how-it-works"
            className="text-white/70 hover:text-white transition-colors px-6 py-4"
          >
            Comment ça marche →
          </a>
        </div>
        <p className="text-white/40 text-sm mt-6">
          100% gratuit, 100% simple, configuration en 30 secondes
        </p>
      </div>
    </section>
  )
}
