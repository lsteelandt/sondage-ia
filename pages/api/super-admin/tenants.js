/**
 * GET /api/super-admin/tenants
 *
 * Renvoie la liste enrichie de tous les tenants, avec leurs stats :
 *   - métadonnées (nom, email, créé le, lastActivity)
 *   - nombre de sondages
 *   - nombre total de réponses
 *   - nuages (attentes + craintes) agrégés sur tous les sondages
 *
 * Auth super-admin requise.
 */

import { requireSuperAdminApi } from '../../../lib/superAdmin.js'
import { getTenantSessions, getTenant } from '../../../lib/tenants.js'
import { readAggregates } from '../../../lib/analytics.js'
import { TENANTS_DIR } from '../../../lib/tenants.js'
import path from 'path'
import { readFileSync } from 'fs'

const SUSPEND_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000 // 30j

async function listAllTenants() {
  const fs = await import('fs/promises')
  let entries
  try {
    entries = await fs.readdir(TENANTS_DIR, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
  const out = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const tenantId = entry.name
    const tenant = await getTenant(tenantId)
    if (!tenant) continue
    const sessions = await getTenantSessions(tenantId)
    const sessionList = Object.values(sessions || {})
    const surveyCount = sessionList.length
    const responseCount = sessionList.reduce(function (sum, s) {
      return sum + (Array.isArray(s.responses) ? s.responses.length : 0)
    }, 0)

    // Nuages : on agrège les responses.needs/fears de toutes les sessions
    const needsAgg = {}
    const fearsAgg = {}
    for (const s of sessionList) {
      if (!s.responses) continue
      for (const r of s.responses) {
        ;(r.needs || []).forEach(function (w) {
          needsAgg[w] = (needsAgg[w] || 0) + 1
        })
        ;(r.fears || []).forEach(function (w) {
          fearsAgg[w] = (fearsAgg[w] || 0) + 1
        })
      }
    }

    const lastActivity = tenant.lastActivity || null
    const lastAt = lastActivity ? new Date(lastActivity.at).getTime() : 0
    const isSuspended = lastAt > 0 && (Date.now() - lastAt) > SUSPEND_THRESHOLD_MS
    const neverActive = !lastAt

    out.push({
      id: tenantId,
      name: tenant.name || '(sans nom)',
      email: tenant.email || '',
      createdAt: tenant.createdAt || null,
      lastActivity,
      surveyCount,
      responseCount,
      isSuspended,
      neverActive,
      wordClouds: { besoins: needsAgg, craintes: fearsAgg },
      sessions: sessionList.map(function (s) {
        return {
          id: s.id,
          label: s.label,
          createdAt: s.createdAt,
          participantCount: s.participantCount || (s.responses || []).length,
        }
      }),
    })
  }
  // Tri par dernière activité DESC, nulls en bas
  out.sort(function (a, b) {
    const at = a.lastActivity ? new Date(a.lastActivity.at).getTime() : 0
    const bt = b.lastActivity ? new Date(b.lastActivity.at).getTime() : 0
    return bt - at
  })
  return out
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const ctx = requireSuperAdminApi(req, res)
  if (!ctx) return

  try {
    const tenants = await listAllTenants()
    // Stats globales
    const totalSurveys = tenants.reduce(function (sum, t) { return sum + t.surveyCount }, 0)
    const totalResponses = tenants.reduce(function (sum, t) { return sum + t.responseCount }, 0)

    // Pageviews 7j
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const aggregates = readAggregates({ since })
    const totalPageviews7d = aggregates.totalPageviews

    return res.status(200).json({
      ok: true,
      tenants,
      stats: {
        totalTenants: tenants.length,
        totalSurveys,
        totalResponses,
        totalPageviews7d,
        byDay: aggregates.byDay,
      },
    })
  } catch (err) {
    console.error('super-admin tenants error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
