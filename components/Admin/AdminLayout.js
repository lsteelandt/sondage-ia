import { useRouter } from 'next/router'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
    { href: '/admin/sessions', label: 'Formations', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  ]

  function isActive(href) {
    return router.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-transilio-blue relative overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 gradient-overlay pointer-events-none" />

      {/* Floating elements */}
      <div className="fixed top-20 left-10 w-96 h-96 bg-transilio-electric/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-72 h-72 bg-transilio-red/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar - Glass Effect */}
      <nav className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Link href="/admin/sessions" className="flex items-center gap-2">
                <Image
                  src="/logo-transilio.png"
                  alt="Transilio"
                  width={120}
                  height={36}
                  className="drop-shadow-md"
                  priority
                />
              </Link>
              <span className="text-white/30 mx-2">|</span>
              <span className="text-sm font-medium text-white/60">Admin</span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {links.map(function (link) {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-classic transition-all duration-200 ' +
                      (active
                        ? 'bg-white text-transilio-blue shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/10')
                    }
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                    </svg>
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/60 hover:text-transilio-red hover:bg-transilio-red/10 rounded-classic transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {loggingOut ? 'Déconnexion...' : 'Déconnexion'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
