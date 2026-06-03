/**
 * Authentification par magic link.
 *
 * Le cookie d'auth (survey_session_${tenantId}) contient un sessionToken
 * op aque (256 bits). On le vérifie côté serveur contre une map en mémoire :
 * les sessionTokens valides sont ceux émis après un consumeMagicLink réussi.
 *
 * En production réelle on utiliserait un store signé (JWT, cookie de session
 * chiffré, ou Redis). Pour un lead-magnet à quelques centaines de tenants, un
 * store in-memory suffit, avec l'inconvénient connu : les tokens sont perdus
 * au redémarrage du serveur — ce qui force un nouveau magic link, comportement
 * acceptable et même souhaitable pour de la sécurité.
 *
 * Note: c'est volontairement stateless côté stockage. On ne persiste PAS le
 * sessionToken dans tenant.json — il vit dans le cookie et dans cette map.
 */

import { getTenant } from './tenants.js'
import { isValidOrigin } from './validate.js'

// Stockage partagé des sessionTokens. On utilise globalThis pour survivre aux
// rechargements HMR de Next.js en dev (chaque recompilation d'API route peut
// sinon recréer une nouvelle instance du module → Map vide → token perdu).
//
// En production, Next.js bundle une seule fois le module, donc globalThis n'a
// pas d'effet. C'est juste une sécurité dev.
const _global = globalThis
const sessionTokens = _global.__transilio_sessionTokens__ || (_global.__transilio_sessionTokens__ = new Map())

if (process.env.NODE_ENV !== 'production') {
  // Log de l'ID de la Map pour debug : doit être stable entre les modules.
  if (!_global.__transilio_sessionTokens_id__) {
    _global.__transilio_sessionTokens_id__ = Math.random().toString(36).slice(2, 8)
    console.log(`[auth] sessionTokens Map init id=${_global.__transilio_sessionTokens_id__}`)
  }
}

export function cookieNameFor(tenantId) {
  return `survey_session_${tenantId}`
}

export function registerSessionToken(tenantId, token) {
  if (!sessionTokens.has(tenantId)) sessionTokens.set(tenantId, new Set())
  sessionTokens.get(tenantId).add(token)
}

export function revokeSessionToken(tenantId, token) {
  sessionTokens.get(tenantId)?.delete(token)
}

export function isValidSessionToken(tenantId, token) {
  return sessionTokens.get(tenantId)?.has(token) === true
}

function readCookie(req, name) {
  const header = req.headers?.cookie || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return null
}

/**
 * Lit le cookie d'auth et le valide. Retourne { tenant, sessionToken } ou null.
 */
export async function getTenantFromRequest(req, tenantId) {
  if (!tenantId) return null
  const cookieName = cookieNameFor(tenantId)
  const token = readCookie(req, cookieName)
  if (!token) return null
  if (!isValidSessionToken(tenantId, token)) return null
  const tenant = await getTenant(tenantId)
  if (!tenant) return null
  return { tenant, sessionToken: token }
}

/**
 * Middleware-style : vérifie l'auth et envoie 401 JSON sinon. Renvoie
 * { tenant } en cas de succès, null sinon.
 */
export async function requireTenantApi(req, res, tenantId) {
  const ctx = await getTenantFromRequest(req, tenantId)
  if (!ctx) {
    res.status(401).json({ error: 'unauthorized' })
    return null
  }
  return { tenant: ctx.tenant, sessionToken: ctx.sessionToken }
}

/**
 * Vérif CSRF : sur les requêtes mutantes (POST/PUT/DELETE/PATCH), on compare
 * l'Origin à l'app URL configurée. Bloque les attaques cross-site classiques.
 */
export function checkCsrf(req, res, appUrl) {
  const method = (req.method || 'GET').toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true
  const origin = req.headers?.origin || req.headers?.referer || ''
  // Certains clients n'envoient pas Origin sur same-origin POST. On accepte.
  if (!origin) return true
  if (isValidOrigin(origin, appUrl)) return true
  res.status(403).json({ error: 'forbidden', reason: 'invalid_origin' })
  return false
}
