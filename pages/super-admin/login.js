/**
 * /super-admin/login
 *
 * Login super-admin. Deux facteurs :
 *  - email : doit correspondre à `superAdmin.email` dans data/config/settings.json
 *  - password : doit correspondre à la variable d'env SUPER_ADMIN_PASSWORD
 *
 * Si SUPER_ADMIN_PASSWORD n'est pas défini côté serveur, l'endpoint renvoie
 * 503 et on affiche un message d'aide pour configurer l'env.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import LegalFooter from '../../components/Common/LegalFooter'

export default function SuperAdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('luc.steelandt@transilio.fr')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [serverConfigured, setServerConfigured] = useState(null)
  const [serverEmail, setServerEmail] = useState(null)

  useEffect(function () {
    fetch('/api/super-admin/login')
      .then(function (res) { return res.json() })
      .then(function (d) {
        setServerConfigured(Boolean(d.configured))
        setServerEmail(d.email || null)
      })
      .catch(function () { setServerConfigured(false) })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      var res = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
      })
      if (res.ok) {
        router.push('/super-admin/dashboard')
        return
      }
      var data = await res.json().catch(function () { return {} })
      if (res.status === 503) {
        setError("L'authentification super-admin n'est pas configurée côté serveur. Définissez SUPER_ADMIN_PASSWORD dans .env.local et redémarrez le serveur.")
      } else if (data.error === 'invalid_credentials') {
        setError("Email ou mot de passe invalide. L'email attendu est " + (serverEmail || 'configuré dans settings.json') + ".")
      } else {
        setError('Erreur : ' + (data.error || 'inconnue'))
      }
    } catch {
      setError('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-transilio-blue relative overflow-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#0F1459] pointer-events-none" />
      <div className="fixed top-20 left-10 w-96 h-96 bg-transilio-electric/20 rounded-full blur-3xl pointer-events-none" />

      <Head>
        <title>Super-admin — Sondage IA</title>
      </Head>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 glass rounded-2xl p-8 max-w-md w-full"
      >
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo-transilio.png" alt="Transilio" width={140} height={32} priority />
          <span className="mt-3 text-white/70 text-xs font-medium px-2 py-0.5 bg-white/10 rounded">
            Super-admin
          </span>
        </div>

        <h1 className="text-xl font-bold text-white mb-6 text-center">Connexion</h1>

        {serverConfigured === false && (
          <div className="mb-4 text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded p-3">
            <strong>Serveur non configuré.</strong> La variable d'env
            <code className="mx-1 px-1 bg-black/30 rounded">SUPER_ADMIN_PASSWORD</code>
            n'est pas définie. Ajoutez-la à <code className="px-1 bg-black/30 rounded">.env.local</code> et redémarrez le serveur.
          </div>
        )}
        {serverConfigured === true && serverEmail && serverEmail !== email && (
          <div className="mb-4 text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded p-3">
            Astuce : l'email autorisé est <code className="px-1 bg-black/30 rounded">{serverEmail}</code>.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={function (e) { setEmail(e.target.value) }}
              required
              className="input-field"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={function (e) { setPassword(e.target.value) }}
              required
              className="input-field"
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded p-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !password}
          className="btn-primary w-full mt-6"
        >
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>

        <LegalFooter className="mt-8" />
      </form>
    </div>
  )
}
