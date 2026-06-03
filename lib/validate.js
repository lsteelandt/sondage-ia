/**
 * Validation des entrées. Pas de dépendance externe (Joi/Zod) pour rester
 * minimaliste — c'est volontaire. Si la base de règles grandit, on remplacera
 * par Zod.
 */

const TENANT_ID_RE = /^[a-z0-9]{4,32}$/
// Format: 4-32 chars alphanumériques minuscules. Les nouveaux tenants sont
// générés à 6 chars hex (cf. generateTenantId), mais on accepte les IDs
// existants plus longs (ex: "transil" pour le tenant historique Transilio).
export function isValidTenantId(id) {
  return typeof id === 'string' && TENANT_ID_RE.test(id)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email)
}

// Domaines d'emails personnels. Liste non exhaustive — le but est de bloquer
// les fournisseurs grand public évidents. Tout email hors de cette liste
// (et valide au sens isValidEmail) est considéré comme professionnel.
export const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'orange.fr',
  'free.fr',
  'wanadoo.fr',
  'laposte.net',
  'sfr.fr',
  'bouygtel.fr',
])

export function isBusinessEmail(email) {
  if (!isValidEmail(email)) return false
  const domain = String(email).split('@')[1]?.toLowerCase()
  if (!domain) return false
  return !PERSONAL_EMAIL_DOMAINS.has(domain)
}

const LABEL_MAX = 120
export function isValidLabel(label) {
  return (
    typeof label === 'string' &&
    label.trim().length > 0 &&
    label.length <= LABEL_MAX
  )
}

// Token magic link : 64 chars hex (256 bits). On vérifie la forme pour rejeter
// les injections dès l'entrée.
const MAGIC_TOKEN_RE = /^[a-f0-9]{64}$/
export function isValidMagicToken(token) {
  return typeof token === 'string' && MAGIC_TOKEN_RE.test(token)
}

// Origine attendue pour vérif CSRF. Retourne true si l'Origin header correspond
// à l'app URL configurée.
export function isValidOrigin(origin, appUrl) {
  if (!origin || !appUrl) return false
  try {
    const o = new URL(origin)
    const a = new URL(appUrl)
    return o.origin === a.origin
  } catch {
    return false
  }
}
