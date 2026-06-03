/**
 * GET /api/super-admin/activity/export
 *
 * Exporte tous les events analytics en CSV. Auth super-admin requise.
 * Renvoie un fichier `sondage-activity-YYYY-MM-DD.csv` en téléchargement.
 *
 * Query :
 *   - ?since=ISO (filtre les events plus récents que since)
 *   - ?tenantId=xxx (ou plusieurs, multi-select)
 */

import { requireSuperAdminApi } from '../../../../lib/superAdmin.js'
import { readEvents } from '../../../../lib/analytics.js'

const COLUMNS = ['ts', 'type', 'path', 'referer', 'duration', 'screen', 'country', 'device', 'visitor', 'ip', 'tenantId']

function parseTenantIds(q) {
  const v = q?.tenantId
  if (v === undefined || v === null) return undefined
  const arr = Array.isArray(v) ? v : [v]
  const list = arr.filter(function (s) { return typeof s === 'string' && s.length > 0 })
  return list.length > 0 ? list : undefined
}

function escapeCsv(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  if (!requireSuperAdminApi(req, res)) return

  const since = typeof req.query.since === 'string' ? req.query.since : null
  const tenantId = parseTenantIds(req.query)

  let events
  try {
    events = readEvents({ since: since || undefined, tenantId })
  } catch (err) {
    console.error('super-admin activity export error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }

  // Tri : plus récents en premier
  events = events.slice().sort(function (a, b) {
    const at = a.ts ? new Date(a.ts).getTime() : 0
    const bt = b.ts ? new Date(b.ts).getTime() : 0
    return bt - at
  })

  const lines = [COLUMNS.join(',')]
  for (const ev of events) {
    lines.push(COLUMNS.map(function (c) { return escapeCsv(ev[c]) }).join(','))
  }
  const csv = lines.join('\n') + '\n'

  // BOM UTF-8 pour qu'Excel ouvre le fichier proprement
  const body = '﻿' + csv

  const today = new Date().toISOString().slice(0, 10)
  const filename = 'sondage-activity-' + today + '.csv'

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).send(body)
}
