/**
 * GET /api/super-admin/activity
 *
 * Renvoie les events analytics paginés, plus récents en premier.
 * Query :
 *   ?page=0&perPage=50
 *   &tenantId=xxx            (un seul tenant, ou)
 *   &tenantId=xxx&tenantId=yyy   (plusieurs, multi-select)
 *
 * Auth super-admin requise.
 */

import { requireSuperAdminApi } from '../../../lib/superAdmin.js'
import { readEvents } from '../../../lib/analytics.js'

function parseTenantIds(q) {
  const v = q?.tenantId
  if (v === undefined || v === null) return undefined
  const arr = Array.isArray(v) ? v : [v]
  const list = arr.filter(function (s) { return typeof s === 'string' && s.length > 0 })
  return list.length > 0 ? list : undefined
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const ctx = requireSuperAdminApi(req, res)
  if (!ctx) return

  const page = Math.max(0, parseInt(req.query.page, 10) || 0)
  const perPage = Math.min(200, Math.max(10, parseInt(req.query.perPage, 10) || 50))
  const tenantId = parseTenantIds(req.query)

  try {
    const events = readEvents({ tenantId })
    // Plus récents en premier
    const sorted = events.slice().sort(function (a, b) {
      const at = a.ts ? new Date(a.ts).getTime() : 0
      const bt = b.ts ? new Date(b.ts).getTime() : 0
      return bt - at
    })
    const start = page * perPage
    const slice = sorted.slice(start, start + perPage)
    return res.status(200).json({
      ok: true,
      events: slice,
      page,
      perPage,
      total: events.length,
      hasMore: start + perPage < events.length,
    })
  } catch (err) {
    console.error('super-admin activity error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
