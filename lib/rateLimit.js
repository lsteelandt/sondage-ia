/**
 * Rate limiter in-memory. Par IP + par clé (ex: 'request-link').
 *
 * Fenêtre glissante : on stocke un tableau de timestamps par clé. À chaque
 * requête, on retire les timestamps hors fenêtre, puis on compte.
 *
 * Limites volontairement généreuses pour un usage normal, dures pour bloquer
 * l'abus. En production réelle on remplacerait par Redis + sliding window,
 * mais pour un lead-magnet français de portée limitée, in-memory suffit.
 *
 * Le store se vide périodiquement pour ne pas fuir la mémoire.
 */

const store = new Map() // key -> { hits: number[] }

const SWEEP_INTERVAL_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store.entries()) {
    if (!v.hits || v.hits.length === 0) {
      store.delete(k)
      continue
    }
    const first = v.hits[0]
    // Si le plus vieux hit date de plus de 2h, on peut jeter l'entry
    // (les windowMs utilisés sont ≤ 1h, donc 2h est un majorant safe)
    if (now - first > 2 * 60 * 60 * 1000) {
      store.delete(k)
    }
  }
}, SWEEP_INTERVAL_MS).unref?.()

function clientIp(req) {
  // Priorité aux headers des reverse-proxy connus (IP du client réel).
  // Si on est derrière Cloudflare, c'est cf-connecting-ip.
  // Si on est derrière Vercel, c'est x-real-ip ou x-vercel-forwarded-for.
  const cf = req.headers?.['cf-connecting-ip']
  if (typeof cf === 'string' && cf.length > 0) return cf.trim()
  const vr = req.headers?.['x-real-ip']
  if (typeof vr === 'string' && vr.length > 0) return vr.trim()
  const vf = req.headers?.['x-vercel-forwarded-for']
  if (typeof vf === 'string' && vf.length > 0) return vf.split(',')[0].trim()
  // x-forwarded-for : on prend la PREMIÈRE IP de la liste (client original),
  // PAS la dernière. Le client est ajouté en tête par le proxy de bordure.
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
    const entry = store.get(k) || { hits: [] }
    entry.hits = entry.hits.filter(function (t) { return now - t < windowMs })
    if (entry.hits.length >= max) {
      const oldest = entry.hits[0]
      const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000)
      res.setHeader('Retry-After', String(retryAfterSec))
      return res.status(429).json({ error: 'rate_limited', retryAfterSec })
    }
    entry.hits.push(now)
    store.set(k, entry)
    return next()
  }
}

// Variante synchrone pour usage direct dans un handler (sans express-style next).
export function checkRateLimit(key, req, { max, windowMs }) {
  const ip = clientIp(req)
  const k = `${key}:${ip}`
  const now = Date.now()
  const entry = store.get(k) || { hits: [] }
  entry.hits = entry.hits.filter(function (t) { return now - t < windowMs })
  if (entry.hits.length >= max) {
    const oldest = entry.hits[0]
    const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000)
    return { allowed: false, retryAfterSec }
  }
  entry.hits.push(now)
  store.set(k, entry)
  return { allowed: true }
}
