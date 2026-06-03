/**
 * GET/POST /api/track?type=pageview&path=/foo&ref=bar&dur=12
 *
 * Endpoint de tracking léger. Réponse 204 No Content.
 * Pas d'auth, pas de cookie. Rate limit 60 events / IP / minute.
 *
 * Query params :
 *  - type : 'pageview' | 'pageview_duration'
 *  - path : chemin de la page
 *  - ref  : referer (URL ou 'direct')
 *  - dur  : durée en secondes (entier)
 *  - sw   : screen.width (proxy device)
 */

import { recordEvent, getCountry, getDeviceType, hashVisitor } from '../../lib/analytics.js'
import { checkRateLimit } from '../../lib/rateLimit.js'

function readParam(req, name) {
  if (req.query && req.query[name] !== undefined) {
    const v = req.query[name]
    if (Array.isArray(v)) return v[0]
    return String(v)
  }
  // En POST, on regarde aussi le body
  if (req.body && req.body[name] !== undefined) {
    return String(req.body[name])
  }
  return ''
}

function clampInt(s, max = 24 * 3600) {
  const n = parseInt(s, 10)
  if (isNaN(n) || n < 0) return 0
  return Math.min(n, max)
}

export default async function handler(req, res) {
  // CORS permissif (pas de credentials, pas de danger)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  // Rate limit par IP : 60 events / minute
  const rl = checkRateLimit('track', req, { max: 60, windowMs: 60 * 1000 })
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec))
    return res.status(429).end()
  }

  const type = readParam(req, 'type') || 'pageview'
  const path = (readParam(req, 'path') || '').slice(0, 256)
  const refRaw = (readParam(req, 'ref') || '').slice(0, 512)
  const dur = clampInt(readParam(req, 'dur'))
  const sw = clampInt(readParam(req, 'sw'), 10000)
  // tid = tenantId (slug), utilisé pour filtrer côté super-admin
  const tid = (readParam(req, 'tid') || '').slice(0, 64)

  if (!['pageview', 'pageview_duration'].includes(type)) {
    return res.status(400).end()
  }
  if (!path) {
    return res.status(400).end()
  }

  const ua = req.headers?.['user-agent'] || ''
  const ip =
    (req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  const visitor = hashVisitor(ip, ua)
  const country = getCountry(req)
  const device = getDeviceType(ua)

  // Classement grossier du referer (hôte seul)
  let referer = 'direct'
  if (refRaw && refRaw !== 'direct') {
    try {
      const u = new URL(refRaw)
      referer = u.hostname
    } catch {
      referer = refRaw.slice(0, 64)
    }
  }

  // On n'enregistre pas le path complet des pages admin pour éviter
  // de loguer les tokens de magic link par accident (le path n'inclut
  // que ?token=... dans le query, pas dans le pathname — on est safe).
  await recordEvent({
    type,
    path,
    referer,
    duration: dur,
    screen: sw,
    country,
    device,
    visitor,
    tenantId: tid || undefined,
  })

  res.setHeader('Cache-Control', 'no-store')
  return res.status(204).end()
}
