import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

/**
 * Extrait le tenantId depuis le path ou le query string.
 * - /admin/{tenantId}/...   → path segment #2
 * - /survey?tenantId=xxx    → query string
 * - autres pages            → null
 */
function extractTenantId(path, query) {
  if (typeof path !== 'string' || !path.startsWith('/admin/')) {
    if (typeof query?.tenantId === 'string') return query.tenantId
    return null
  }
  const parts = path.split('/').filter(Boolean) // ['admin', tenantId, 'sondages' | 'resultats']
  if (parts.length < 2) return null
  const t = parts[1]
  // Filtre basique : tenantId attendu = [a-z0-9]{4,8}
  if (!/^[a-z0-9]{4,8}$/.test(t)) return null
  return t
}

/**
 * Tracker analytics léger — pas de cookie, pas de SDK externe.
 *
 * Sur chaque changement de route (premier render + navigation client),
 * envoie un event `pageview` au endpoint /api/track. Un event
 * `pageview_duration` est envoyé au démontage de la page (mesure
 * grossière : avantunload, pas de keep-alive sur navigation).
 */
export default function Tracker() {
  const router = useRouter()
  const startRef = useRef(0)
  const currentPathRef = useRef('')

  useEffect(() => {
    function buildParams(type, path, ref, extra) {
      const params = new URLSearchParams({ type, path, ref, ...extra })
      const tid = extractTenantId(path, router.query)
      if (tid) params.set('tid', tid)
      return params
    }

    function sendPageview() {
      const path = window.location.pathname
      const ref = document.referrer || 'direct'
      const sw = typeof window !== 'undefined' ? window.screen?.width || 0 : 0
      startRef.current = Date.now()
      currentPathRef.current = path
      const params = buildParams('pageview', path, ref, { sw: String(sw) })
      const url = '/api/track?' + params.toString()
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url)
        } else {
          fetch(url, { method: 'GET', keepalive: true }).catch(() => {})
        }
      } catch { /* ignore */ }
    }

    function sendDuration() {
      const path = currentPathRef.current
      if (!path) return
      const dur = Math.round((Date.now() - startRef.current) / 1000)
      if (dur <= 0) return
      const ref = document.referrer || 'direct'
      const params = buildParams('pageview_duration', path, ref, { dur: String(dur) })
      const url = '/api/track?' + params.toString()
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url)
        } else {
          fetch(url, { method: 'GET', keepalive: true }).catch(() => {})
        }
      } catch { /* ignore */ }
    }

    // Premier render
    sendPageview()

    // Sur chaque changement de route, on envoie la duration de la
    // page précédente avant de tracker la nouvelle.
    function onRouteChange() {
      sendDuration()
      sendPageview()
    }
    router.events.on('routeChangeComplete', onRouteChange)
    window.addEventListener('beforeunload', sendDuration)

    return () => {
      router.events.off('routeChangeComplete', onRouteChange)
      window.removeEventListener('beforeunload', sendDuration)
      // Sur démontage SPA (changement de route Next.js), on envoie aussi
      sendDuration()
    }
  }, [router])

  return null
}
