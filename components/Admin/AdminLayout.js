/**
 * AdminLayout — header/nav partagés pour toutes les pages /admin/[tenantId]/*.
 *
 * Props:
 *  - tenant : { id, name, email, createdAt } (chargé par la page parente)
 *  - active : 'dashboard' | 'sondages' | 'resultats' — pour highlight du nav
 *  - children : contenu de la page
 */
import { useRouter } from 'next/router'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LegalFooter from '../Common/LegalFooter'

export default function AdminLayout({ tenant, active, children }) {
  const router = useRouter()
  const tenantId = tenant?.id || router.query.tenantId
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (!tenantId) return
    setLoggingOut(true)
    try {
      await fetch('/api/tenant/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      })
      window.location.href = '/'
    } catch {
      setLoggingOut(false)
    }
  }

  const links = tenantId ? [
    { href: `/admin/${tenantId}/sondages`, label: 'Espace de sondages', key: 'sondages' },
  ] : []

  function isActive(key) {
    return active === key
  }

  return (
    <div className="min-h-screen bg-transilio-blue relative overflow-hidden">
      <div className="fixed inset-0 bg-[#0F1459] pointer-events-none" />
      <div className="fixed top-20 left-10 w-96 h-96 bg-transilio-electric/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-72 h-72 bg-transilio-red/10 rounded-full blur-3xl pointer-events-none" />

      <nav className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Sondage IA — accueil">
                <Image
                  src="/logo-transilio.png"
                  alt="Transilio"
                  width={120}
                  height={27}
                  className="drop-shadow-md"
                  priority
                />
              </Link>
            </div>

            <div className="flex items-center gap-1">
              {links.map((link) => {
                const activeLink = isActive(link.key)
                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    className={
                      'inline-flex items-center px-4 py-2 text-sm font-medium rounded-classic transition-all duration-200 ' +
                      (activeLink
                        ? 'bg-white text-transilio-blue shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/10')
                    }
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/60 hover:text-transilio-red hover:bg-transilio-red/10 rounded-classic transition-all duration-200 disabled:opacity-50"
            >
              {loggingOut ? 'Déconnexion...' : 'Déconnexion'}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
        <LegalFooter className="mt-12" />
      </main>
    </div>
  )
}
