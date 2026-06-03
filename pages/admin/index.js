/**
 * /admin — page de garde admin.
 *
 * Si un magic link a redirigé ici avec ?token=XXX&tenant=YYY (legacy),
 * on ne gère plus ce cas : l'URL canonique est /admin/{tenantId}?token=XXX.
 * Cette page affiche juste un message d'aide.
 */
import Head from 'next/head'
import Link from 'next/link'

export default function AdminIndex() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transilio-blue">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <Head><title>Admin — Sondage IA</title></Head>
        <h1 className="text-2xl font-bold text-white mb-4">Espace administrateur</h1>
        <p className="text-white/70 mb-6">
          Pour accéder à votre espace d&apos;administration, utilisez le lien
          reçu par email. Il ressemble à :
        </p>
        <code className="block bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/60 mb-6 font-mono">
          https://app/admin/{'{tenantId}'}?token=...
        </code>
        <Link href="/" className="btn-primary inline-block">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
