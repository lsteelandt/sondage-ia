/**
 * GET /api/tenant/public/[tenantId]
 *
 * Renvoie les infos publiques minimales d'un tenant (juste le nom).
 * PAS d'auth requise — un répondant qui arrive avec un lien doit pouvoir
 * voir pour quelle organisation il va répondre.
 *
 * On ne renvoie PAS l'email ni les magic links ni les sessionTokens.
 */

import { getTenant } from '../../../../lib/tenants.js'
import { isValidTenantId } from '../../../../lib/validate.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { tenantId } = req.query
  if (!isValidTenantId(tenantId)) {
    return res.status(400).json({ error: 'invalid_tenantId' })
  }

  const tenant = await getTenant(tenantId)
  if (!tenant) {
    return res.status(404).json({ error: 'tenant_not_found' })
  }

  return res.status(200).json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
    },
  })
}
