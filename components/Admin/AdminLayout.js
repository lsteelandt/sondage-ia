import { useRouter } from 'next/router'
import { useState } from 'react'
import Link from 'next/link'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      window.location.href = '/admin'
    } catch {
      setLoggingOut(false)
    }
  }

  const links = [
    { href: '/admin/sessions', label: 'Formations' },
    { href: '/admin/resultats', label: 'Résultats' },
  ]

  function isActive(href) {
    if (href === '/admin/resultats') {
      return router.pathname === '/admin/resultats'
    }
    return router.pathname === href
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <span className="font-bold text-gray-800">Sondage IA - Admin</span>
              <div className="flex gap-1">
                {links.map(function (link) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={'px-3 py-1.5 rounded-md text-sm font-medium transition ' +
                        (isActive(link.href)
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100')}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
