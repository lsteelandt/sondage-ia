import fs from 'fs/promises'
import { readFileSync as fsReadFileSync, chmodSync as fsChmodSync } from 'fs'
import path from 'path'

export async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

export async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

export async function writeJsonFile(filePath, data) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function generateHexId(length = 8) {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

export function readFileSync(filePath, encoding) {
  return fsReadFileSync(filePath, encoding)
}

// Force les permissions 600 (lecture/écriture owner only).
// Utilisé pour les fichiers de données sensibles (tenant.json, sessions.json).
export function chmod600Sync(filePath) {
  try {
    fsChmodSync(filePath, 0o600)
  } catch {
    // best-effort : certains FS (Windows, certains conteneurs) ignorent
  }
}

// 6 chars hex en lowercase — pour les tenantId publics (URLs).
// Note: pas cryptographiquement fort (utilise Math.random), mais le tenantId
// n'est pas un secret : le secret est le sessionToken dans le cookie.
export function generateTenantId() {
  return generateHexId(6)
}
