/**
 * POST /api/tenant/logout
 *
 * Body: { tenantId: string }
 *
 * Révoque le sessionToken et efface le cookie.
 */

import { isValidTenantId } from '../../../lib/validate.js'
import { revokeSessionToken, cookieNameFor } from '../../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { tenantId } = req.body || {}
  if (!isValidTenantId(tenantId)) {
    return res.status(400).json({ error: 'invalid_tenantId' })
  }

  const cookieName = cookieNameFor(tenantId)
  const cookie = `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`
  res.setHeader('Set-Cookie', cookie)

  // On tente de révoquer le token lu dans le cookie (s'il existe encore).
  const cookieHeader = req.headers?.cookie || ''
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === cookieName) {
      revokeSessionToken(tenantId, v.join('='))
    }
  }

  return res.status(200).json({ ok: true })
}
