/**
 * POST /api/super-admin/logout
 *
 * Efface le cookie `survey_superadmin`.
 */

import { clearSuperAdminCookie } from '../../../lib/superAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  clearSuperAdminCookie(res)
  return res.status(200).json({ ok: true })
}
