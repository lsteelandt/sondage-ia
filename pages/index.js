import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Hero from '../components/Landing/Hero'
import HowItWorks from '../components/Landing/HowItWorks'
import AccessAppModal from '../components/Landing/AccessAppModal'
import LegalFooter from '../components/Common/LegalFooter'

/**
 * Landing publique (lead magnet).
 *
 * Un seul CTA "J'accède à mon application de sondage" qui ouvre la modale
 * unifiée AccessAppModal : saisie email → si tenant existe → magic link ;
 * si non → confirmation de création.
 */
export default function Home() {
  const router = useRouter()
  const { session } = router.query
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (session && router.isReady) {
      router.replace('/survey?session=' + encodeURIComponent(session))
    }
  }, [session, router.isReady])

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-transilio-blue">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[#0F1459]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-transilio-electric/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-transilio-red/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="z-10 text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Redirection vers le sondage...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Head>
        <title>Sondage IA — Comprenez la maturité de votre organisation</title>
        <meta
          name="description"
          content="Sondage anonyme de 5 minutes pour évaluer comment vos équipes perçoivent l'IA. Résultats synthétisés par IA. Gratuit et sans engagement."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[#0F1459]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-transilio-electric/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-transilio-red/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-transilio-blue-light/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        <Hero onCreateClick={() => setModalOpen(true)} />
        <HowItWorks />

        <section className="py-16 md:py-20 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Pour qui ?
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Collectivités, entreprises, associations, établissements
              publics : toute organisation qui s&apos;interroge sur la
              maturité de ses équipes face à l&apos;IA.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-accent px-8 py-4 text-lg"
            >
              Démarrer le sondage de mes équipes
            </button>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto text-center text-white/40 text-sm space-y-3">
            <p>
              Outil développé par{' '}
              <span className="text-white/60 font-medium">Transilio</span>
            </p>
            <p>
              Besoin d&apos;aide à l&apos;usage de l&apos;outil, faites-le nous
              savoir à{' '}
              <a
                href="mailto:contact@transilio.fr"
                className="text-white/70 hover:text-white underline underline-offset-4"
              >
                contact@transilio.fr
              </a>
            </p>
            <LegalFooter className="pt-2" />
          </div>
        </footer>
      </div>

      <AccessAppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
