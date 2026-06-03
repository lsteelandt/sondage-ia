/**
 * GET /api/super-admin/stats/daily
 *
 * Renvoie les stats analytics (pageviews) agrégées par jour, sur les 7 derniers
 * jours. Filtre par tenant(s) si spécifié.
 *
 * Query :
 *   - ?tenantId=xxx            (un seul, ou)
 *   - ?tenantId=xxx&tenantId=yyy   (plusieurs, multi-select)
 *   - ?days=30 (optionnel, défaut 7)
 *
 * Réponse : { ok, days, byDay, totalPageviews, byTenant: { tenantId: byDay } }
 *
 * `byTenant` n'est renvoyé que si plusieurs tenants sont sélectionnés
 * (utile pour afficher un empilé).
 *
 * Auth super-admin requise.
 */

import { requireSuperAdminApi } from '../../../../lib/superAdmin.js'
import { readAggregates, readEvents } from '../../../../lib/analytics.js'

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

  const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 7))
  const tenantId = parseTenantIds(req.query)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Agrégat global (tous events OU filtrés)
    const agg = readAggregates({ since, tenantId })
    const result = {
      ok: true,
      days: days,
      byDay: agg.byDay,
      totalPageviews: agg.totalPageviews,
      byTenant: null,
    }

    // Si plusieurs tenants sélectionnés : on décompose par tenant pour
    // permettre un affichage empilé
    if (Array.isArray(tenantId) && tenantId.length > 1) {
      const byTenant = {}
      for (const t of tenantId) {
        const a = readAggregates({ since, tenantId: [t] })
        byTenant[t] = a.byDay
      }
      result.byTenant = byTenant
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('super-admin stats daily error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
