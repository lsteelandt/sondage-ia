/**
 * GET /api/tenant/[tenantId]/me
 *
 * Renvoie les infos publiques du tenant si la session est valide, 401 sinon.
 * Utilisé par les pages admin au mount pour vérifier l'auth.
 */

import { requireTenantApi } from '../../../../lib/auth.js'
import { recordActivity, maybeRunPurge } from '../../../../lib/tenants.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { tenantId } = req.query
  maybeRunPurge()
  const ctx = await requireTenantApi(req, res, tenantId)
  if (!ctx) return

  // Best-effort : on garde la trace de la dernière activité admin.
  recordActivity(tenantId, { kind: 'admin', email: ctx.tenant.email })

  return res.status(200).json({
    ok: true,
    tenant: {
      id: ctx.tenant.id,
      name: ctx.tenant.name,
      email: ctx.tenant.email,
      createdAt: ctx.tenant.createdAt,
      lastActivity: ctx.tenant.lastActivity || null,
    },
  })
}
