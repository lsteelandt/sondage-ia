/**
 * POST /api/tenant/[tenantId]/session/[sessionId]/email
 *
 * Body: { code: string, email: string }
 *
 * Envoie au répondant (par son email) un récapitulatif de ses réponses
 * au sondage. Pas d'auth requise : c'est juste un service de commodité
 * pour le répondant qui veut garder une trace.
 */

import { getTenantSessions } from '../../../../../../lib/tenants.js'
import { isValidTenantId } from '../../../../../../lib/validate.js'
import { isValidEmail } from '../../../../../../lib/validate.js'
import { sendEmail } from '../../../../../../lib/email.js'

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

  const { tenantId, sessionId } = req.query
  if (!isValidTenantId(tenantId)) {
    return res.status(400).json({ error: 'invalid_tenantId' })
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'invalid_sessionId' })
  }

  const { code, email } = req.body || {}
  if (!code || !email) {
    return res.status(400).json({ error: 'code_and_email_required' })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' })
  }

  try {
    const sessions = await getTenantSessions(tenantId)
    const sessionData = sessions[sessionId]
    if (!sessionData) {
      return res.status(404).json({ error: 'session_not_found' })
    }

    const response = (sessionData.responses || []).find((r) => r.id === code)
    const needsText = (response?.needs?.length > 0)
      ? response.needs.join(', ')
      : 'Aucune attente renseignée'
    const fearsText = (response?.fears?.length > 0)
      ? response.fears.join(', ')
      : 'Aucune crainte renseignée'

    const subject = 'Vos réponses au sondage IA'
    const html =
      `<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">` +
      `<div style="background: #0F1459; color: white; padding: 24px; border-radius: 8px 8px 0 0;">` +
      `<h1 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 22px;">Récapitulatif de vos réponses</h1>` +
      `</div>` +
      `<div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">` +
      `<p style="color: #374151; margin-bottom: 16px;">Bonjour,</p>` +
      `<p style="color: #374151; margin-bottom: 16px;">Voici un récapitulatif de vos réponses au sondage IA <strong>${escapeHtml(sessionData.label || sessionId)}</strong>.</p>` +
      `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">` +
      `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 140px;"><strong>Code participant</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(code)}</td></tr>` +
      `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Sondage</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(sessionData.label || sessionId)}</td></tr>` +
      `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; vertical-align: top;"><strong>Vos attentes</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(needsText)}</td></tr>` +
      `<tr><td style="padding: 8px 0; color: #6b7280; vertical-align: top;"><strong>Vos craintes</strong></td><td style="padding: 8px 0;">${escapeHtml(fearsText)}</td></tr>` +
      `</table>` +
      `<p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Cet email vous a été envoyé depuis l'application Sondage IA.</p>` +
      `</div></div>`

    const text =
      `Sondage IA - Récapitulatif\n\n` +
      `Code participant : ${code}\n` +
      `Sondage : ${sessionData.label || sessionId}\n\n` +
      `Vos attentes : ${needsText}\n\n` +
      `Vos craintes : ${fearsText}\n\n` +
      `Cet email vous a été envoyé depuis l'application Sondage IA.`

    try {
      await sendEmail({ to: email, subject, html, text })
    } catch (emailErr) {
      if (emailErr.code === 'SMTP_NOT_CONFIGURED') {
        return res.status(500).json({ error: 'smtp_not_configured' })
      }
      throw emailErr
    }
    return res.status(200).json({ success: true, message: 'Email envoyé avec succès' })
  } catch (error) {
    console.error('tenant session email error:', error)
    return res.status(500).json({ error: 'internal_error', message: error.message })
  }
}
