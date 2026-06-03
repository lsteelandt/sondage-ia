/**
 * POST /api/super-admin/login
 *
 * Body: { email: string, password: string }
 *
 * Vérifie que `password` correspond à process.env.SUPER_ADMIN_PASSWORD.
 * Si OK, set le cookie `survey_superadmin` (HMAC-SHA256 signé) et renvoie 200.
 *
 * L'email est stocké dans le payload du cookie mais n'est pas utilisé pour
 * autoriser l'accès — c'est juste de l'info de session. En pratique,
 * SUPER_ADMIN_PASSWORD est le seul secret.
 */

import crypto from 'crypto'
import {
  isSuperAdminConfigured,
  getSuperAdminEmail,
  signSessionToken,
  setSuperAdminCookie,
} from '../../../lib/superAdmin.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Endpoint de diagnostic public : permet à la page login de savoir
    // si l'auth est configurée côté serveur (sans révéler le mot de passe).
    return res.status(200).json({
      configured: isSuperAdminConfigured(),
      email: getSuperAdminEmail() || null,
    })
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  if (!isSuperAdminConfigured()) {
    return res.status(503).json({ error: 'super_admin_not_configured' })
  }
  const { email, password } = req.body || {}
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email_required' })
  }
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'password_required' })
  }

  // 1) Email doit correspondre à l'email autorisé
  const authorizedEmail = getSuperAdminEmail()
  if (String(email).toLowerCase() !== authorizedEmail) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  // 2) Mot de passe doit correspondre (comparaison en temps constant)
  const expected = process.env.SUPER_ADMIN_PASSWORD
  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  const token = signSessionToken(email)
  setSuperAdminCookie(res, token)
  return res.status(200).json({ ok: true, email: email.toLowerCase() })
}
