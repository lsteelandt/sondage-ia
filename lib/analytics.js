/**
 * Analytics maison — stockage JSON-Lines append-only.
 *
 * Chaque event est une ligne JSON dans data/analytics/events.jsonl.
 * Append atomique sur la plupart des OS (file system buffered I/O).
 *
 * Le tracking est volontairement minimaliste et RGPD-clean :
 *  - Pas de cookie, pas de fingerprinting agressif
 *  - IP hashée en SHA-256 tronqué (anonymisation)
 *  - User-Agent hashé de la même manière
 *  - Pas de partage tiers
 *
 * Pour les géolocalisations, on s'appuie sur les headers CDN en priorité
 * (x-vercel-ip-country, cf-ipcountry) et un fallback best-effort via
 * le User-Agent (langue / locale Windows). Pas de base GeoIP embarquée.
 */

import path from 'path'
import crypto from 'crypto'
import { readFileSync } from './utils.js'
import { ensureDir, chmod600Sync } from './utils.js'

const ANALYTICS_DIR = path.join(process.cwd(), 'data', 'analytics')
const EVENTS_PATH = path.join(ANALYTICS_DIR, 'events.jsonl')
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB — au-delà, on archive et on repart

/**
 * Hash anonyme d'un visiteur (IP + UA tronqué).
 * SHA-256 tronqué à 16 chars hex (64 bits d'entropie, suffisant pour
 * compter des visiteurs uniques sur 30j sans pouvoir remonter à l'IP).
 */
export function hashVisitor(ip, ua) {
  const raw = (ip || '0.0.0.0') + '|' + (ua || 'unknown')
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16)
}

/**
 * Devine le pays depuis les headers CDN. Si rien, fallback sur un
 * best-effort via le User-Agent. Renvoie "Unknown" si impossible.
 */
export function getCountry(req) {
  const headers = req?.headers || {}
  const c =
    headers['x-vercel-ip-country'] ||
    headers['cf-ipcountry'] ||
    headers['x-country-code'] ||
    headers['x-geo-country']
  if (typeof c === 'string' && c.length === 2) return c.toUpperCase()

  // Fallback : langue du navigateur (très peu fiable, mais c'est RGPD-clean)
  const al = headers['accept-language'] || ''
  const m = al.match(/[a-z]{2}-([A-Z]{2})/)
  if (m) return m[1]

  return 'Unknown'
}

/**
 * Devine un device type à partir du User-Agent. Catégories simples :
 * desktop / mobile / tablet / bot.
 */
export function getDeviceType(ua) {
  if (!ua) return 'unknown'
  const s = ua.toLowerCase()
  if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit/.test(s)) return 'bot'
  if (/tablet|ipad|playbook|silk/.test(s)) return 'tablet'
  if (/mobile|iphone|ipod|android.*mobile|silk-accelerated|blackberry|opera mini|windows phone/.test(s)) return 'mobile'
  return 'desktop'
}

/**
 * Append un event au fichier JSON-Lines. Best-effort : on n'échoue
 * jamais la requête appelante en cas d'erreur d'écriture.
 */
export async function recordEvent(event) {
  try {
    await ensureDir(ANALYTICS_DIR)
    // Rotation si le fichier dépasse la limite : on déplace l'ancien
    // vers un fichier horodaté. Conservateur — on garde tout.
    try {
      const fs = await import('fs/promises')
      const stat = await fs.stat(EVENTS_PATH).catch(() => null)
      if (stat && stat.size > MAX_FILE_BYTES) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        await fs.rename(EVENTS_PATH, path.join(ANALYTICS_DIR, `events-${ts}.jsonl`))
      }
    } catch { /* ignore rotation errors */ }

    const line = JSON.stringify({
      ts: new Date().toISOString(),
      ...event,
    }) + '\n'

    const fs = await import('fs/promises')
    await fs.appendFile(EVENTS_PATH, line, 'utf8')
    chmod600Sync(EVENTS_PATH)
  } catch (err) {
    // Best-effort : on log mais on ne propage pas.
    console.error('analytics recordEvent failed:', err.message)
  }
}

/**
 * Lit tous les events depuis le fichier actif. Renvoie [] si absent.
 * Filtres optionnels :
 *  - `since` (ISO date string)
 *  - `tenantId` (string ou string[]) : un ou plusieurs tenantIds
 */
export function readEvents({ since, tenantId } = {}) {
  let raw
  try {
    raw = readFileSync(EVENTS_PATH, 'utf8')
  } catch {
    return []
  }
  const out = []
  const sinceMs = since ? new Date(since).getTime() : 0
  const tidSet = normalizeTenantIdFilter(tenantId)
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t) continue
    try {
      const ev = JSON.parse(t)
      if (sinceMs && new Date(ev.ts).getTime() < sinceMs) continue
      if (tidSet && !tidSet.has(ev.tenantId || '')) continue
      out.push(ev)
    } catch { /* skip malformed line */ }
  }
  return out
}

function normalizeTenantIdFilter(tenantId) {
  if (tenantId === undefined || tenantId === null) return null
  const arr = Array.isArray(tenantId) ? tenantId : [tenantId]
  const list = arr.filter(function (s) { return typeof s === 'string' && s.length > 0 })
  if (list.length === 0) return null
  return new Set(list)
}

/**
 * Agrège les events. Renvoie un objet avec totaux et groupements.
 * Accepte les mêmes filtres que readEvents.
 */
export function readAggregates({ since, tenantId } = {}) {
  const events = readEvents({ since, tenantId })
  const aggregates = {
    totalEvents: events.length,
    totalPageviews: events.filter(e => e.type === 'pageview').length,
    totalSessions: new Set(events.map(e => e.visitor)).size,
    byDay: {},
    byCountry: {},
    byPath: {},
    byReferer: {},
    byDevice: {},
    byType: {},
    recent: events.slice(-50).reverse(),
  }

  for (const ev of events) {
    const day = (ev.ts || '').slice(0, 10)
    if (day) aggregates.byDay[day] = (aggregates.byDay[day] || 0) + 1
    aggregates.byCountry[ev.country] = (aggregates.byCountry[ev.country] || 0) + 1
    aggregates.byPath[ev.path] = (aggregates.byPath[ev.path] || 0) + 1
    aggregates.byReferer[ev.referer || 'direct'] = (aggregates.byReferer[ev.referer || 'direct'] || 0) + 1
    aggregates.byDevice[ev.device] = (aggregates.byDevice[ev.device] || 0) + 1
    aggregates.byType[ev.type] = (aggregates.byType[ev.type] || 0) + 1
  }

  return aggregates
}
