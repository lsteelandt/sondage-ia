/**
 * Envoi d'email via SMTP, configuration globale dans data/config/settings.json.
 *
 * Pas de SMTP par tenant : on mutualise. Les credentials sont dans
 * process.env.SMTP_USER / SMTP_PASS (cf. .env.local).
 *
 * Le caller passe {to, subject, html, text}. Le HTML doit déjà être formaté
 * en inline CSS (les clients mail ne lisent pas les <style>).
 */

import nodemailer from 'nodemailer'
import path from 'path'
import { readJsonFile } from './utils.js'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')

let cachedSettings = null
let cachedAt = 0
const SETTINGS_TTL_MS = 30 * 1000

async function getSettings() {
  const now = Date.now()
  if (cachedSettings && now - cachedAt < SETTINGS_TTL_MS) {
    return cachedSettings
  }
  cachedSettings = await readJsonFile(SETTINGS_PATH)
  cachedAt = now
  return cachedSettings
}

export function invalidateSettingsCache() {
  cachedSettings = null
  cachedAt = 0
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to || !subject) throw new Error('to and subject required')
  if (!html && !text) throw new Error('html or text required')

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    const err = new Error('SMTP_USER ou SMTP_PASS non configuré')
    err.code = 'SMTP_NOT_CONFIGURED'
    throw err
  }

  const settings = await getSettings()
  const smtpConfig = settings.smtp || {}
  const from = settings.emailFrom || 'contact@transilio.fr'

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port || 587,
    secure: smtpConfig.secure || false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from,
    to,
    subject,
    html: html || `<pre>${escapeHtml(text || '')}</pre>`,
    text: text || stripHtml(html || ''),
  })
}

// --- helpers ---

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripHtml(s) {
  return String(s).replace(/<[^>]+>/g, '')
}
