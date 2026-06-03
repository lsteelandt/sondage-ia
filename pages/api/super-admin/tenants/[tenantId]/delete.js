/**
 * POST /api/super-admin/tenants/[tenantId]/delete
 *
 * Supprime manuellement un tenant. Whitelist : transilio (espace interne) ne
 * peut pas être supprimé. Auth super-admin requise.
 *
 * Body (optionnel) : { archive: boolean } — si true, archive les réponses
 * dans data/archive/ avant de supprimer le dossier actif (par défaut false :
 * suppression sèche).
 */

import { deleteTenant, getTenant, getTenantSessions } from '../../../../../lib/tenants.js'
import { requireSuperAdminApi } from '../../../../../lib/superAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  if (!requireSuperAdminApi(req, res)) return

  const { tenantId } = req.query
  const archive = Boolean(req.body && req.body.archive)

  try {
    // Si archive demandé, on archive d'abord (logique reprise de purgeStaleTenants)
    if (archive) {
      const tenant = await getTenant(tenantId)
      if (tenant) {
        const sessions = await getTenantSessions(tenantId)
        const path = await import('path')
        const fs = await import('fs/promises')
        const { chmod600Sync } = await import('../../../../../lib/utils.js')
        const archiveDir = path.join(process.cwd(), 'data', 'archive')
        await fs.mkdir(archiveDir, { recursive: true })
        const stamp = new Date().toISOString().replace(/[:.]/g, '-')
        const archiveFile = path.join(archiveDir, tenantId + '-' + stamp + '.json')
        const payload = {
          archivedAt: new Date().toISOString(),
          reason: 'manual_delete_with_archive',
          tenant: tenant,
          sessions: sessions || {},
        }
        await fs.writeFile(archiveFile, JSON.stringify(payload, null, 2), 'utf8')
        chmod600Sync(archiveFile)
      }
    }

    const result = await deleteTenant(tenantId)
    if (!result.ok) {
      const code = result.reason
      const status = code === 'protected' ? 403 : code === 'not_found' ? 404 : 400
      return res.status(status).json({ error: code })
    }
    return res.status(200).json({ ok: true, tenantId: tenantId })
  } catch (err) {
    console.error('super-admin delete tenant error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
