/**
 * Webhooks sortants — best-effort, fire-and-forget.
 *
 * Configuration dans data/config/settings.json :
 *   {
 *     "webhook": {
 *       "url": "https://example.com/hooks/sondage",
 *       "events": ["tenant.created", "tenant.deleted"],
 *       "secret": "optional-shared-secret",
 *       "pushover": {
 *         "token": "azGDORePK8gMaC0QOYAMyEEuzJnyUi",
 *         "user": "uQiRzpo4DXghDmr9QzzfQu27cmVRsG",
 *         "title": "Sondage IA",
 *         "priority": 1,
 *         "sound": "pianobar"
 *       }
 *     }
 *   }
 *
 * Modes :
 *   - webhook "classique" (Content-Type: application/json, payload {event,sentAt,data})
 *   - webhook "pushover" (Content-Type: application/x-www-form-urlencoded,
 *     champs token/user/message/title/priority/sound)
 *
 * `url` est obligatoire pour activer les webhooks. `events` est optionnel
 * (par défaut : tous les événements supportés). `secret` est ignoré en mode
 * pushover (pas de signature possible). `pushover` exige `token` et `user`.
 *
 * Aucun appel ne propage une erreur : les webhooks sont de la notification,
 * pas une condition de succès de l'opération métier.
 */

import crypto from 'crypto'
import { readFileSync } from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')
const SUPPORTED_EVENTS = ['tenant.created', 'tenant.deleted']
const DEFAULT_TIMEOUT_MS = 5000

function buildMessage(event, data) {
  if (event === 'tenant.created') {
    return 'Nouvel espace Sondage IA : ' + (data && data.name ? data.name : '?') +
      ' (' + (data && data.email ? data.email : '?') + ')'
  }
  if (event === 'tenant.deleted') {
    return 'Espace Sondage IA supprimé : ' + (data && data.name ? data.name : '?') +
      ' (' + (data && data.email ? data.email : '?') + ')'
  }
  return event
}

function readSettings() {
  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'))
  } catch {
    return null
  }
}

function getWebhookConfig() {
  const settings = readSettings()
  const wh = settings && settings.webhook
  if (!wh || typeof wh.url !== 'string' || wh.url.length === 0) return null

  // Mode pushover : transforme le payload en form-urlencoded
  const pushover = wh.pushover && typeof wh.pushover === 'object' ? wh.pushover : null
  let mode = 'json'
  let pushoverCfg = null
  if (pushover) {
    if (typeof pushover.token !== 'string' || pushover.token.length === 0) return null
    if (typeof pushover.user !== 'string' || pushover.user.length === 0) return null
    pushoverCfg = {
      token: pushover.token,
      user: pushover.user,
      title: typeof pushover.title === 'string' ? pushover.title : 'Sondage IA',
      priority: Number.isFinite(pushover.priority) ? pushover.priority : 0,
      sound: typeof pushover.sound === 'string' && pushover.sound.length > 0 ? pushover.sound : null,
    }
    mode = 'pushover'
  }

  let events
  if (Array.isArray(wh.events) && wh.events.length > 0) {
    events = wh.events.filter(function (e) { return SUPPORTED_EVENTS.includes(e) })
  } else {
    events = SUPPORTED_EVENTS.slice()
  }
  return {
    url: wh.url,
    mode: mode,
    pushover: pushoverCfg,
    // secret ignoré en mode pushover (pas de signature)
    secret: mode === 'json' && typeof wh.secret === 'string' && wh.secret.length > 0 ? wh.secret : null,
    events: events,
    timeoutMs: Number.isFinite(wh.timeoutMs) ? wh.timeoutMs : DEFAULT_TIMEOUT_MS,
  }
}

/**
 * Envoie un événement webhook. Renvoie un rapport { ok, status, error? } ou
 * { ok: false, skipped: true } si l'événement n'est pas activé.
 *
 * Cette fonction ne throw jamais. Le caller n'a rien à faire.
 */
export async function sendWebhook(event, payload) {
  if (!SUPPORTED_EVENTS.includes(event)) {
    return { ok: false, skipped: true, reason: 'unsupported_event' }
  }
  const config = getWebhookConfig()
  if (!config) return { ok: false, skipped: true, reason: 'no_config' }
  if (!config.events.includes(event)) {
    return { ok: false, skipped: true, reason: 'event_not_subscribed' }
  }

  const jsonBody = JSON.stringify({
    event: event,
    sentAt: new Date().toISOString(),
    data: payload,
  })

  const headers = { 'User-Agent': 'sondage-intro-webhook/1', 'X-Webhook-Event': event }
  let body

  if (config.mode === 'pushover') {
    // Form-urlencoded pour l'API Pushover
    const fields = {
      token: config.pushover.token,
      user: config.pushover.user,
      title: config.pushover.title,
      message: buildMessage(event, payload),
      priority: String(config.pushover.priority),
    }
    if (config.pushover.sound) fields.sound = config.pushover.sound
    body = new URLSearchParams(fields).toString()
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  } else {
    // JSON classique (signature HMAC possible)
    body = jsonBody
    headers['Content-Type'] = 'application/json'
    if (config.secret) {
      const sig = crypto
        .createHmac('sha256', config.secret)
        .update(body)
        .digest('hex')
      headers['X-Webhook-Signature'] = 'sha256=' + sig
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(function () { controller.abort() }, config.timeoutMs)

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: headers,
      body: body,
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error('[webhook] ' + event + ' → ' + res.status + ' ' + res.statusText)
      return { ok: false, status: res.status, error: 'http_' + res.status }
    }
    return { ok: true, status: res.status }
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timeout' : err.message
    console.error('[webhook] ' + event + ' failed:', reason)
    return { ok: false, error: reason }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Helper qui fire-and-forget un webhook sans bloquer la chaîne appelante.
 * Utilisé après une opération métier (create/delete).
 */
export function fireWebhook(event, payload) {
  sendWebhook(event, payload).catch(function (err) {
    console.error('[webhook] fire-and-forget failed:', err.message)
  })
}

export { SUPPORTED_EVENTS }
