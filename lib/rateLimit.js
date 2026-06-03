/**
 * Rate limiter in-memory. Par IP + par clé (ex: 'request-link').
 *
 * Limites volontairement généreuses pour un usage normal, dures pour bloquer
 * l'abus. En production réelle on remplacerait par Redis + sliding window,
 * mais pour un lead-magnet français de portée limitée, in-memory suffit.
 *
 * Le store se vide périodiquement pour ne pas fuir la mémoire.
 */

const store = new Map() // key -> { count, windowStart }

const SWEEP_INTERVAL_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store.entries()) {
    if (now - v.windowStart > v.windowMs * 2) {
      store.delete(k)
    }
  }
}, SWEEP_INTERVAL_MS).unref?.()

function clientIp(req) {
  // x-forwarded-for peut contenir plusieurs IPs séparées par des virgules,
  // on prend la première (client original).
  const xff = req.headers?.['x-forwarded-for']
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

export function rateLimit(key, { max, windowMs }) {
  return (req, res, next) => {
    const ip = clientIp(req)
    const k = `${key}:${ip}`
    const now = Date.now()
    const entry = store.get(k)
    if (!entry || now - entry.windowStart > windowMs) {
      store.set(k, { count: 1, windowStart: now, windowMs })
      return next()
    }
    if (entry.count >= max) {
      const retryAfterSec = Math.ceil((entry.windowMs - (now - entry.windowStart)) / 1000)
      res.setHeader('Retry-After', String(retryAfterSec))
      return res.status(429).json({ error: 'rate_limited', retryAfterSec })
    }
    entry.count += 1
    return next()
  }
}

// Variante synchrone pour usage direct dans un handler (sans express-style next).
export function checkRateLimit(key, req, { max, windowMs }) {
  const ip = clientIp(req)
  const k = `${key}:${ip}`
  const now = Date.now()
  const entry = store.get(k)
  if (!entry || now - entry.windowStart > windowMs) {
    store.set(k, { count: 1, windowStart: now, windowMs })
    return { allowed: true }
  }
  if (entry.count >= max) {
    const retryAfterSec = Math.ceil((windowMs - (now - entry.windowStart)) / 1000)
    return { allowed: false, retryAfterSec }
  }
  entry.count += 1
  return { allowed: true }
}
