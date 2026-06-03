/**
 * Couche d'accès aux données tenant.
 *
 * Stockage: data/tenants/[tenantId]/tenant.json
 *
 * Garanties:
 *  - read-modify-write sérialisé par tenant via un mutex in-memory
 *  - magic links hashés en SHA-256 (pas de bcrypt : un magic link a un TTL court,
 *    pas besoin d'être slow-hash)
 *  - tokens générés via crypto.randomBytes(32) — 256 bits
 *  - email normalisé en lowercase avant recherche
 */

import path from 'path'
import crypto from 'crypto'
import { generateTenantId, readJsonFile, writeJsonFile, ensureDir, chmod600Sync } from './utils.js'
import { isValidEmail, isValidTenantId, isValidMagicToken } from './validate.js'
import { fireWebhook } from './webhook.js'

export const DATA_DIR = path.join(process.cwd(), 'data')
export const TENANTS_DIR = path.join(DATA_DIR, 'tenants')

const MAGIC_LINK_TTL_MS = 60 * 60 * 1000 // 1 heure
const MAGIC_LINK_BYTES = 32 // 256 bits -> 64 chars hex

// Mutex simple par tenant : sérialise les read-modify-write pour éviter les
// race conditions (notamment quand un email entre en collision avec une
// création de tenant et qu'on a 2 POST simultanés).
const mutexes = new Map() // tenantId -> Promise

function withMutex(tenantId, fn) {
  const prev = mutexes.get(tenantId) || Promise.resolve()
  const next = prev.catch(() => {}).then(fn)
  mutexes.set(
    tenantId,
    next.finally(() => {
      if (mutexes.get(tenantId) === next) mutexes.delete(tenantId)
    })
  )
  return next
}

export { withMutex }

function tenantFilePath(tenantId) {
  return path.join(TENANTS_DIR, tenantId, 'tenant.json')
}

function sessionsFilePath(tenantId) {
  return path.join(TENANTS_DIR, tenantId, 'sessions.json')
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function newToken() {
  return crypto.randomBytes(MAGIC_LINK_BYTES).toString('hex')
}

function purgeExpired(tenant) {
  if (!tenant.magicLinks) return tenant
  const now = Date.now()
  for (const [hash, link] of Object.entries(tenant.magicLinks)) {
    if (new Date(link.expiresAt).getTime() < now) {
      delete tenant.magicLinks[hash]
    }
  }
  return tenant
}

// --- API publique ---

export async function getTenant(tenantId) {
  if (!isValidTenantId(tenantId)) return null
  // getTenant doit distinguer "n'existe pas" de "existe mais vide".
  // On lit le fichier et on renvoie null si absent (au lieu de {} par défaut).
  try {
    const fs = await import('fs/promises')
    const data = await fs.readFile(tenantFilePath(tenantId), 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

export async function getTenantSessions(tenantId) {
  if (!isValidTenantId(tenantId)) return {}
  return readJsonFile(sessionsFilePath(tenantId))
}

export async function writeTenantSessions(tenantId, sessions) {
  if (!isValidTenantId(tenantId)) {
    throw new Error(`Invalid tenantId: ${tenantId}`)
  }
  return writeJsonFile(sessionsFilePath(tenantId), sessions)
}

export async function findTenantByEmail(email) {
  const normalized = normalizeEmail(email)
  if (!isValidEmail(normalized)) return null
  // Scan linéaire du dossier tenants. OK pour quelques centaines de tenants,
  // pas OK à 10k+. Si on scale : index email -> tenantId dans un fichier plat.
  let entries
  try {
    const fs = await import('fs/promises')
    entries = await fs.readdir(TENANTS_DIR, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const tenant = await getTenant(entry.name)
    if (tenant && normalizeEmail(tenant.email) === normalized) {
      return tenant
    }
  }
  return null
}

/**
 * Crée un nouveau tenant. Retourne { tenant, token, magicLinkUrl }.
 * Le token est en clair ici, hashé avant stockage.
 */
export async function createTenant({ name, email }) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('name required')
  }
  if (!isValidEmail(email)) {
    throw new Error('valid email required')
  }
  const normalized = normalizeEmail(email)

  // Si un tenant existe déjà pour cet email, on ne crée pas de doublon —
  // on renvoie null et le caller doit utiliser createMagicLinkForExistingTenant.
  const existing = await findTenantByEmail(normalized)
  if (existing) return { duplicate: true, tenant: existing }

  // Génère un tenantId non-collision : retry si le dossier existe déjà.
  let tenantId
  for (let i = 0; i < 5; i += 1) {
    const candidate = generateTenantId()
    if (!(await getTenant(candidate))) {
      tenantId = candidate
      break
    }
  }
  if (!tenantId) throw new Error('Could not generate unique tenantId')

  const tenant = {
    id: tenantId,
    name: name.trim().slice(0, 120),
    email: normalized,
    createdAt: new Date().toISOString(),
    magicLinks: {},
  }
  await withMutex(tenantId, async () => {
    await ensureDir(path.join(TENANTS_DIR, tenantId))
    await writeJsonFile(tenantFilePath(tenantId), tenant)
    await writeJsonFile(sessionsFilePath(tenantId), {})
    // Forcer 600 sur tenant.json (sessions.json est vide, mais on le chmod aussi).
    chmod600Sync(tenantFilePath(tenantId))
    chmod600Sync(sessionsFilePath(tenantId))
  })

  // Webhook de création (best-effort, fire-and-forget).
  fireWebhook('tenant.created', {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    createdAt: tenant.createdAt,
  })

  return { duplicate: false, tenant }
}

/**
 * Crée un magic link pour un tenant existant (ou celui qu'on vient de créer).
 * Retourne { token (en clair, à mettre dans l'URL), magicLinkUrl, expiresAt }.
 */
export async function createMagicLink(tenant, appUrl) {
  if (!tenant || !tenant.id) throw new Error('tenant required')
  const token = newToken()
  const tokenHash = hashToken(token)
  const now = Date.now()
  const link = {
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + MAGIC_LINK_TTL_MS).toISOString(),
  }
  await withMutex(tenant.id, async () => {
    const current = await getTenant(tenant.id)
    if (!current) throw new Error(`tenant ${tenant.id} disappeared`)
    purgeExpired(current)
    if (!current.magicLinks) current.magicLinks = {}
    current.magicLinks[tokenHash] = link
    await writeJsonFile(tenantFilePath(tenant.id), current)
  })
  const magicLinkUrl = `${appUrl.replace(/\/$/, '')}/admin/${tenant.id}?token=${token}`
  return { token, magicLinkUrl, expiresAt: link.expiresAt }
}

/**
 * Consomme un magic link : vérifie hash et expiration. Le lien reste
 * réutilisable tant qu'il n'a pas expiré. Retourne { ok, tenant } ou
 * { ok: false, reason }.
 */
export async function consumeMagicLink(tenantId, token) {
  if (!isValidTenantId(tenantId) || !isValidMagicToken(token)) {
    return { ok: false, reason: 'malformed' }
  }
  const tokenHash = hashToken(token)
  return withMutex(tenantId, async () => {
    const tenant = await getTenant(tenantId)
    if (!tenant) return { ok: false, reason: 'unknown_tenant' }
    purgeExpired(tenant)
    const link = tenant.magicLinks?.[tokenHash]
    if (!link) return { ok: false, reason: 'unknown_token' }
    if (new Date(link.expiresAt).getTime() < Date.now()) {
      // Persistons la suppression pour qu'il ne soit plus jamais testé.
      delete tenant.magicLinks[tokenHash]
      await writeJsonFile(tenantFilePath(tenantId), tenant)
      return { ok: false, reason: 'expired' }
    }
    // Le magic link reste valide tant qu'il n'a pas expiré (usage multiple
    // pendant la durée de vie de 1h). On ne le marque plus comme consommé.
    return { ok: true, tenant }
  })
}

/**
 * Crée un nouveau sessionToken pour un tenant (post-consume). Stocké côté
 * serveur uniquement si on étendait plus tard, mais ici on le rend stateless
 * via un cookie HttpOnly. La valeur est un secret 256 bits — non persisté.
 */
export function newSessionToken() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Whitelist des tenants protégés contre la suppression (ni manuelle, ni
 * automatique par purge). Le tenant `transilio` est l'espace interne de
 * démo / de référence — on ne le supprime jamais.
 */
export const PROTECTED_TENANTS = new Set(['transilio'])

/**
 * Supprime manuellement un tenant. Whitelist respectée : PROTECTED_TENANTS
 * ne peuvent pas être supprimés. Les réponses ne sont PAS archivées (c'est
 * une suppression explicite demandée par l'admin). Le webhook `tenant.deleted`
 * est envoyé (fire-and-forget) après succès.
 *
 * Renvoie { ok: true, tenant: {...} } ou { ok: false, reason: ... }.
 */
export async function deleteTenant(tenantId) {
  if (!isValidTenantId(tenantId)) return { ok: false, reason: 'invalid_tenantId' }
  if (PROTECTED_TENANTS.has(tenantId)) return { ok: false, reason: 'protected' }
  const tenant = await getTenant(tenantId)
  if (!tenant) return { ok: false, reason: 'not_found' }
  const fs = await import('fs/promises')
  await fs.rm(path.join(TENANTS_DIR, tenantId), { recursive: true, force: true })
  // Webhook après suppression réussie
  fireWebhook('tenant.deleted', {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    deletedAt: new Date().toISOString(),
  })
  return { ok: true, tenant: tenant }
}

/**
 * Enregistre une activité sur un tenant (admin ou sondé).
 * Best-effort : on tolère les erreurs (tenant introuvable, IO, etc.) — c'est
 * de l'info de monitoring, pas de la donnée métier. On sérialise via le
 * mutex du tenant pour éviter d'écraser une autre modification concurrente.
 *
 * actor = { kind: 'admin', email } | { kind: 'respondent', code, sessionId? }
 * `code` est le code participant (ex. "VIRIB"), `sessionId` le code de sondage.
 */
export async function recordActivity(tenantId, actor) {
  if (!isValidTenantId(tenantId) || !actor || !actor.kind) return
  return withMutex(tenantId, async () => {
    const tenant = await getTenant(tenantId)
    if (!tenant) return
    // Filet : on ne garde que les champs utiles pour limiter la taille.
    const sanitized =
      actor.kind === 'admin'
        ? { kind: 'admin', email: String(actor.email || tenant.email || '').toLowerCase() }
        : actor.kind === 'respondent'
          ? { kind: 'respondent', code: String(actor.code || '').toUpperCase().slice(0, 16), sessionId: actor.sessionId ? String(actor.sessionId) : null }
          : null
    if (!sanitized) return
    tenant.lastActivity = {
      at: new Date().toISOString(),
      ...sanitized,
    }
    await writeJsonFile(tenantFilePath(tenantId), tenant)
  }).catch(function (err) {
    // Best-effort : on ne casse jamais la chaîne appelante.
    console.error('recordActivity failed:', err.message)
  })
}

// --- Purge des tenants inactifs (Bloc 6) ---

const DEFAULT_PURGE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000 // 30 jours
const LAZY_PURGE_INTERVAL_MS = 60 * 60 * 1000 // 1h
const LAZY_PURGE_FLAG_PATH = path.join(DATA_DIR, '.last_purge_at')

/**
 * Calcule la date d'activité d'un tenant.
 * Priorité : lastActivity.at > dernière date magicLink > createdAt.
 * Renvoie null si aucune source exploitable.
 */
function tenantActivityDate(tenant) {
  if (!tenant) return null
  if (tenant.lastActivity && tenant.lastActivity.at) {
    const d = new Date(tenant.lastActivity.at)
    if (!isNaN(d.getTime())) return d
  }
  let latest = null
  if (tenant.magicLinks) {
    for (const link of Object.values(tenant.magicLinks)) {
      if (!link) continue
      const candidates = [link.createdAt, link.lastUsedAt, link.expiresAt].filter(Boolean)
      for (const c of candidates) {
        const d = new Date(c)
        if (isNaN(d.getTime())) continue
        if (!latest || d > latest) latest = d
      }
    }
  }
  if (tenant.createdAt) {
    const d = new Date(tenant.createdAt)
    if (!isNaN(d.getTime()) && (!latest || d > latest)) latest = d
  }
  return latest
}

/**
 * Purge les tenants dont la dernière activité est antérieure à `thresholdMs`.
 *  - Si une session a des réponses, on archive `data/tenants/[tenantId]` vers
 *    `data/archive/[tenantId]-[date].json` (le tenant reste en ligne pour
 *    permettre à l'admin de consulter les nuages ; on retire juste le
 *    dossier actif).
 *  - Sinon (tenant vide / jamais utilisé), on supprime le dossier
 *    complètement.
 *
 * Renvoie { purged, archived, errors, scanned, thresholdMs }.
 */
export async function purgeStaleTenants({
  thresholdMs = DEFAULT_PURGE_THRESHOLD_MS,
  now = Date.now(),
  archiveDir = path.join(DATA_DIR, 'archive'),
  dryRun = false,
} = {}) {
  const report = { purged: [], archived: [], errors: [], scanned: 0, thresholdMs, thresholdDate: new Date(now - thresholdMs).toISOString(), dryRun }
  let entries
  try {
    const fs = await import('fs/promises')
    entries = await fs.readdir(TENANTS_DIR, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return report
    throw err
  }

  await ensureDir(archiveDir)

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    report.scanned += 1
    const tenantId = entry.name
    try {
      const tenant = await getTenant(tenantId)
      if (!tenant) continue
      const lastActivity = tenantActivityDate(tenant)
      // Pas d'info d'activité du tout : on le considère comme "à purger"
      // s'il n'a aucune réponse — c'est typiquement un tenant jamais activé.
      if (lastActivity && now - lastActivity.getTime() < thresholdMs) continue

      // Vérifier s'il y a des réponses (qui justifient l'archivage)
      const sessions = await getTenantSessions(tenantId)
      const hasResponses = Object.values(sessions || {}).some(function (s) {
        return s && Array.isArray(s.responses) && s.responses.length > 0
      })

      if (hasResponses) {
        const stamp = new Date(now).toISOString().replace(/[:.]/g, '-')
        const archiveFile = path.join(archiveDir, `${tenantId}-${stamp}.json`)
        if (dryRun) {
          report.archived.push({ tenantId, archiveFile, lastActivity: lastActivity ? lastActivity.toISOString() : null })
          continue
        }
        // Archive : on consolide sessions + tenant dans un seul fichier.
        const fs = await import('fs/promises')
        const tenantPath = tenantFilePath(tenantId)
        const sessionsPath = sessionsFilePath(tenantId)
        const payload = {
          archivedAt: new Date(now).toISOString(),
          thresholdMs,
          lastActivity: tenant.lastActivity || null,
          tenant: JSON.parse(await fs.readFile(tenantPath, 'utf8')),
          sessions: JSON.parse(await fs.readFile(sessionsPath, 'utf8')),
        }
        await fs.writeFile(archiveFile, JSON.stringify(payload, null, 2), 'utf8')
        chmod600Sync(archiveFile)
        // Supprime le dossier actif
        await fs.rm(path.join(TENANTS_DIR, tenantId), { recursive: true, force: true })
        report.archived.push({ tenantId, archiveFile, lastActivity: lastActivity ? lastActivity.toISOString() : null })
      } else {
        if (dryRun) {
          report.purged.push({ tenantId, lastActivity: lastActivity ? lastActivity.toISOString() : null })
          continue
        }
        // Pas de réponses : on supprime tout.
        const fs = await import('fs/promises')
        await fs.rm(path.join(TENANTS_DIR, tenantId), { recursive: true, force: true })
        report.purged.push({ tenantId, lastActivity: lastActivity ? lastActivity.toISOString() : null })
      }
    } catch (err) {
      report.errors.push({ tenantId, message: err.message })
    }
  }
  return report
}

/**
 * Lance `purgeStaleTenants` au plus une fois par heure, en fire-and-forget.
 * Aucun appel ne bloque la requête appelante. Les erreurs sont loguées.
 */
export function maybeRunPurge() {
  try {
    const fs = require('fs')
    let last = 0
    try {
      last = parseInt(fs.readFileSync(LAZY_PURGE_FLAG_PATH, 'utf8').trim(), 10) || 0
    } catch { /* absent */ }
    if (Date.now() - last < LAZY_PURGE_INTERVAL_MS) return
    // On met le flag AVANT pour ne pas avoir 2 purges concurrentes.
    fs.writeFileSync(LAZY_PURGE_FLAG_PATH, String(Date.now()))
    fs.chmodSync(LAZY_PURGE_FLAG_PATH, 0o600)
    purgeStaleTenants().catch(function (err) {
      console.error('maybeRunPurge failed:', err.message)
    })
  } catch (err) {
    console.error('maybeRunPurge flag write failed:', err.message)
  }
}
