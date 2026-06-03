/**
 * Auth super-admin.
 *
 * Authentification à deux facteurs simples :
 *  - L'email doit correspondre à `superAdmin.email` dans data/config/settings.json
 *    (config versionnable, modifiable sans redéploiement).
 *  - Le mot de passe doit correspondre à la variable d'env SUPER_ADMIN_PASSWORD
 *    (secret, jamais en clair dans le repo).
 *
 * Si SUPER_ADMIN_PASSWORD n'est pas défini OU si settings.json n'a pas de
 * `superAdmin.email`, l'auth est désactivée et tous les endpoints renvoient 503.
 *
 * En cas de succès, on set le cookie `survey_superadmin` (payload JSON signé
 * HMAC-SHA256, expiration 8h).
 */

import crypto from 'crypto'
import path from 'path'
import { readFileSync } from 'fs'

const COOKIE_NAME = 'survey_superadmin'
const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000 // 8h
const PAYLOAD_VERSION = 1
const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')

function getSecret() {
  const pwd = process.env.SUPER_ADMIN_PASSWORD
  if (!pwd) return null
  return crypto.createHash('sha256').update('super-admin:' + pwd).digest('hex')
}

function readSettings() {
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'))
  } catch {
    return null
  }
}

function getAuthorizedEmail() {
  const settings = readSettings()
  const email = settings && settings.superAdmin && settings.superAdmin.email
  if (typeof email === 'string' && email.length > 0) {
    return email.toLowerCase()
  }
  return null
}

export function isSuperAdminConfigured() {
  return Boolean(getSecret() && getAuthorizedEmail())
}

export function getSuperAdminEmail() {
  return getAuthorizedEmail()
}

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  const padded = pad ? s + '='.repeat(4 - pad) : s
  return Buffer.from(padded, 'base64')
}

export function signSessionToken(email) {
  const secret = getSecret()
  if (!secret) throw new Error('super_admin_not_configured')
  const payload = {
    v: PAYLOAD_VERSION,
    email: String(email || '').toLowerCase().slice(0, 200),
    exp: Date.now() + COOKIE_MAX_AGE_MS,
  }
  const body = b64urlEncode(JSON.stringify(payload))
  const sig = b64urlEncode(
    crypto.createHmac('sha256', secret).update(body).digest()
  )
  return body + '.' + sig
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null
  const secret = getSecret()
  if (!secret) return null
  const idx = token.indexOf('.')
  if (idx <= 0 || idx === token.length - 1) return null
  const body = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  const expected = b64urlEncode(
    crypto.createHmac('sha256', secret).update(body).digest()
  )
  // Comparaison en temps constant
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null
  }
  let payload
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf8'))
  } catch {
    return null
  }
  if (!payload || payload.v !== PAYLOAD_VERSION) return null
  if (!payload.email || typeof payload.email !== 'string') return null
  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
  return { email: payload.email, exp: payload.exp }
}

function readCookie(req, name) {
  const raw = req.headers?.cookie || ''
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

export function getSuperAdminFromRequest(req) {
  const token = readCookie(req, COOKIE_NAME)
  if (!token) return null
  const session = verifySessionToken(token)
  if (!session) return null
  // L'email dans le cookie doit toujours correspondre à l'email autorisé
  // (au cas où settings.json aurait été modifié entre-temps).
  const authorized = getAuthorizedEmail()
  if (!authorized || session.email !== authorized) return null
  return session
}

/**
 * Helper pour les endpoints API : renvoie la session super-admin ou null,
 * et écrit un 401 si pas connecté. Le caller fait `if (!ctx) return`.
 */
export function requireSuperAdminApi(req, res) {
  if (!isSuperAdminConfigured()) {
    res.status(503).json({ error: 'super_admin_not_configured' })
    return null
  }
  const session = getSuperAdminFromRequest(req)
  if (!session) {
    res.status(401).json({ error: 'unauthorized' })
    return null
  }
  return session
}

export function setSuperAdminCookie(res, token) {
  const attrs = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${Math.floor(COOKIE_MAX_AGE_MS / 1000)}`,
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.NODE_ENV === 'production') attrs.push('Secure')
  res.setHeader('Set-Cookie', attrs.join('; '))
}

export function clearSuperAdminCookie(res) {
  const attrs = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (process.env.NODE_ENV === 'production') attrs.push('Secure')
  res.setHeader('Set-Cookie', attrs.join('; '))
}
