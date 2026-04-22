import nodemailer from 'nodemailer'
import path from 'path'
import { readJsonFile } from '../../../../lib/utils'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json')
const SESSIONS_PATH = path.join(process.cwd(), 'data', 'sessions.json')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  var sessionId = req.query.sessionId
  var { code, email } = req.body

  if (!code || !email) {
    return res.status(400).json({ error: 'Code participant et email requis' })
  }

  // Validation basique de l'email
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide' })
  }

  try {
    // Charger la configuration
    var settings = await readJsonFile(SETTINGS_PATH)
    var sessions = await readJsonFile(SESSIONS_PATH)

    // Vérifier que la session existe
    var sessionData = sessions[sessionId]
    if (!sessionData) {
      return res.status(404).json({ error: 'Session non trouvée' })
    }

    // Trouver la réponse du participant
    var response = (sessionData.responses || []).find(function (r) {
      return r.id === code
    })

    // Construire le contenu de l'email
    var needsText = (response && response.needs && response.needs.length > 0)
      ? response.needs.join(', ')
      : 'Aucune attente renseignée'

    var fearsText = (response && response.fears && response.fears.length > 0)
      ? response.fears.join(', ')
      : 'Aucune crainte renseignée'

    var smtpConfig = settings.smtp || {}
    var emailFrom = settings.emailFrom || 'formation@transilio.fr'
    var emailSubject = settings.emailSubject || 'Vos réponses au sondage IA'

    // Vérifier que les identifiants SMTP sont configurés
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP_USER ou SMTP_PASS non configuré dans les variables d\'environnement')
      return res.status(500).json({ error: 'Configuration SMTP manquante' })
    }

    // Créer le transporteur
    var transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port || 587,
      secure: smtpConfig.secure || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // HTML du mail
    var htmlContent =
      '<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">' +
      '<div style="background: #0F1459; color: white; padding: 24px; border-radius: 8px 8px 0 0;">' +
      '<h1 style="margin: 0; font-family: Space Grotesk, sans-serif; font-size: 22px;">' + emailSubject + '</h1>' +
      '</div>' +
      '<div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">' +
      '<p style="color: #374151; margin-bottom: 16px;">Bonjour,</p>' +
      '<p style="color: #374151; margin-bottom: 16px;">Voici un récapitulatif de vos réponses au sondage IA pour la formation <strong>' + (sessionData.label || sessionId) + '</strong>.</p>' +

      '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">' +
      '<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 140px;"><strong>Code participant</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">' + code + '</td></tr>' +
      '<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Formation</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">' + (sessionData.label || sessionId) + '</td></tr>' +
      '<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; vertical-align: top;"><strong>Vos attentes</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">' + needsText + '</td></tr>' +
      '<tr><td style="padding: 8px 0; color: #6b7280; vertical-align: top;"><strong>Vos craintes</strong></td><td style="padding: 8px 0;">' + fearsText + '</td></tr>' +
      '</table>' +

      '<p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Cet email vous a été envoyé depuis l\'application Sondage IA.</p>' +
      '</div></div>'

    // Envoyer l'email
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: emailSubject,
      html: htmlContent,
      text:
        'Sondage IA - Récapitulatif\n\n' +
        'Code participant : ' + code + '\n' +
        'Formation : ' + (sessionData.label || sessionId) + '\n\n' +
        'Vos attentes : ' + needsText + '\n\n' +
        'Vos craintes : ' + fearsText + '\n\n' +
        'Cet email vous a été envoyé depuis l\'application Sondage IA.',
    })

    return res.status(200).json({ success: true, message: 'Email envoyé avec succès' })
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email: ' + error.message })
  }
}
