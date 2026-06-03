/**
 * POST /api/admin/purge
 *
 * Lance purgeStaleTenants et renvoie le rapport. Utilisé par le dashboard
 * super-admin. Auth super-admin requise.
 *
 * Body (optionnel) : { thresholdDays: number, dryRun: boolean } — défaut 30 / false.
 */

import { purgeStaleTenants } from '../../../lib/tenants.js'
import { requireSuperAdminApi } from '../../../lib/superAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  if (!requireSuperAdminApi(req, res)) return

  const body = req.body || {}
  const thresholdDays = Number.isFinite(body.thresholdDays) ? body.thresholdDays : 30
  const dryRun = Boolean(body.dryRun)

  try {
    const report = await purgeStaleTenants({
      thresholdMs: thresholdDays * 24 * 60 * 60 * 1000,
      dryRun: dryRun,
    })
    return res.status(200).json({ ok: true, ...report })
  } catch (err) {
    console.error('admin purge error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
