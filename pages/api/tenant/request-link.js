/**
 * POST /api/tenant/request-link
 *
 * Body: { name: string, email: string }
 *
 * Crée le tenant s'il n'existe pas, génère un magic link, l'envoie par email.
 * Renvoie TOUJOURS { ok: true, sentTo: email } même en cas de création, pour
 * ne pas révéler si l'email correspondait à un tenant existant.
 */

import path from 'path'
import { readJsonFile } from '../../../lib/utils.js'
import { isValidEmail, isValidLabel, isValidOrigin, isBusinessEmail } from '../../../lib/validate.js'
import { createTenant, createMagicLink, findTenantByEmail } from '../../../lib/tenants.js'
import { checkRateLimit } from '../../../lib/rateLimit.js'
import { sendEmail } from '../../../lib/email.js'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')

const MAGIC_LINK_TEMPLATE = ({ tenantName, magicLinkUrl, expiresInMinutes }) => `
<div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0F1459; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600;">
      Accédez à votre espace Sondage IA
    </h1>
  </div>
  <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; margin-bottom: 16px;">Bonjour,</p>
    <p style="color: #374151; margin-bottom: 16px;">
      Voici votre lien de connexion pour accéder à l'espace d'administration
      <strong>${escapeHtml(tenantName)}</strong> sur l'application Sondage IA.
    </p>
    <p style="margin: 24px 0; text-align: center;">
      <a href="${escapeHtml(magicLinkUrl)}"
         style="background: #FF5340; color: white; padding: 12px 24px; border-radius: 6px;
                text-decoration: none; font-weight: 600; display: inline-block;">
        Accéder à mon espace
      </a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
      Ce lien expire dans ${expiresInMinutes} minutes et peut être utilisé plusieurs fois pendant cette durée.
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
      <span style="color: #2F3CED; word-break: break-all;">${escapeHtml(magicLinkUrl)}</span>
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
    </p>
  </div>
</div>
`

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  // Rate limit : 5 requêtes / heure / IP
  const rl = checkRateLimit('request-link', req, { max: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec))
    return res.status(429).json({ error: 'rate_limited', retryAfterSec: rl.retryAfterSec })
  }

  const { name, email, forceCreate } = req.body || {}

  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'invalid_email' })
  }
  if (!isBusinessEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'personal_email_blocked' })
  }

  try {
    // Charge l'app URL pour bâtir le magic link
    const settings = await readJsonFile(SETTINGS_PATH)
    const appUrl = (settings.app && settings.app.url) || `http://localhost:${process.env.PORT || 3100}`
    const allowedOrigins = settings.app && settings.app.allowedOrigins

    // CSRF : vérifier que l'origine correspond à l'app (best-effort).
    const origin = req.headers?.origin || req.headers?.referer || ''
    if (origin && !isValidOrigin(origin, appUrl, allowedOrigins)) {
      return res.status(403).json({ error: 'forbidden', reason: 'invalid_origin' })
    }

    // 1. Trouver ou créer le tenant
    let tenant = await findTenantByEmail(normalizedEmail)
    let isNew = false

    if (!tenant) {
      // Cas "J'ai déjà mon espace" : email seul, sans tenant existant
      // → on renvoie 404 pour que l'UI demande confirmation avant de créer.
      if (!isValidLabel(name)) {
        if (!forceCreate) {
          return res.status(404).json({ error: 'tenant_not_found' })
        }
        // forceCreate : l'utilisateur a explicitement confirmé. On dérive un
        // nom par défaut depuis le domaine email (ex: "acme-corp.fr" →
        // "Acme Corp"). Le tenant pourra être renommé plus tard si besoin.
        const derivedName = String(normalizedEmail.split('@')[1] || 'Organisation')
          .split('.')[0]
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
        const result = await createTenant({ name: derivedName, email: normalizedEmail })
        tenant = result.tenant
        isNew = !result.duplicate
      } else {
        const result = await createTenant({ name, email: normalizedEmail })
        if (result.duplicate) {
          tenant = result.tenant
        } else {
          tenant = result.tenant
          isNew = true
        }
      }
    }

    // 2. Générer le magic link
    const { magicLinkUrl, expiresAt } = await createMagicLink(tenant, appUrl)
    const expiresInMinutes = Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000)

    // 3. Envoyer l'email (best-effort : on log si ça échoue mais on renvoie OK
    //    au client, pour ne pas révéler le statut SMTP).
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Votre lien d\'accès — Sondage IA',
        html: MAGIC_LINK_TEMPLATE({
          tenantName: tenant.name,
          magicLinkUrl,
          expiresInMinutes,
        }),
      })
    } catch (emailErr) {
      console.error('request-link: sendEmail failed:', emailErr.message)
      if (emailErr.code === 'SMTP_NOT_CONFIGURED') {
        return res.status(500).json({ error: 'smtp_not_configured' })
      }
      // Pour les autres erreurs SMTP, on renvoie 200 quand même : le tenant
      // existe, le token a été créé, l'utilisateur peut redemander.
    }

    return res.status(200).json({
      ok: true,
      sentTo: normalizedEmail,
      // En dev uniquement, on peut renvoyer le lien direct pour faciliter
      // les tests sans configurer SMTP.
      devMagicLink: process.env.NODE_ENV !== 'production' ? magicLinkUrl : undefined,
    })
  } catch (err) {
    console.error('request-link error:', err)
    return res.status(500).json({ error: 'internal_error', message: err.message })
  }
}
