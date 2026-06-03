/**
 * POST /api/tenant/consume-magic-link
 *
 * Body: { tenantId: string, token: string }
 *
 * Vérifie le magic link, génère un sessionToken, set le cookie.
 * Renvoie { ok: true, redirect: '/admin/[tenantId]' }.
 */

import { consumeMagicLink, newSessionToken } from '../../../lib/tenants.js'
import { registerSessionToken, cookieNameFor } from '../../../lib/auth.js'
import { isValidTenantId, isValidMagicToken } from '../../../lib/validate.js'
import { checkRateLimit } from '../../../lib/rateLimit.js'
import { readJsonFile } from '../../../lib/utils.js'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  // Rate limit plus permissif (10/h) car le user peut retry après expiration
  const rl = checkRateLimit('consume-magic-link', req, { max: 10, windowMs: 60 * 60 * 1000 })
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec))
    return res.status(429).json({ error: 'rate_limited', retryAfterSec: rl.retryAfterSec })
  }

  const { tenantId, token } = req.body || {}

  if (!isValidTenantId(tenantId)) {
    return res.status(400).json({ error: 'invalid_tenantId' })
  }
  if (!isValidMagicToken(token)) {
    return res.status(400).json({ error: 'invalid_token_format' })
  }

  try {
    const result = await consumeMagicLink(tenantId, token)
    if (!result.ok) {
      // Tous les échecs renvoient 401 (pas 400, pour ne pas révéler pourquoi).
      return res.status(401).json({ error: 'invalid_or_expired_link' })
    }

    // Génère et enregistre le sessionToken
    const sessionToken = newSessionToken()
    registerSessionToken(tenantId, sessionToken)

    // Durée du cookie : alignée sur settings.session.maxAgeMs
    const settings = await readJsonFile(SETTINGS_PATH)
    const maxAgeMs = (settings.session && settings.session.maxAgeMs) || 1800000
    const cookieName = cookieNameFor(tenantId)

    const isProd = process.env.NODE_ENV === 'production'
    const cookieFlags = [
      `${cookieName}=${sessionToken}`,
      'Path=/',
      `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
      'HttpOnly',
      'SameSite=Strict',
    ]
    if (isProd) cookieFlags.push('Secure')
    res.setHeader('Set-Cookie', cookieFlags.join('; '))

    return res.status(200).json({
      ok: true,
      redirect: `/admin/${tenantId}`,
      tenant: { id: result.tenant.id, name: result.tenant.name, email: result.tenant.email },
    })
  } catch (err) {
    console.error('consume-magic-link error:', err)
    return res.status(500).json({ error: 'internal_error', message: err.message })
  }
}
