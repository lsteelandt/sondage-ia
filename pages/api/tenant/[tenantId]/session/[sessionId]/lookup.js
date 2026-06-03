/**
 * POST /api/tenant/[tenantId]/session/[sessionId]/lookup
 *
 * Body: { code: string }
 *
 * Renvoie la réponse du participant identifié par `code` (uniquement),
 * ou 404 si pas trouvée. Permet au répondant qui retape son code
 * de retrouver ses propres attentes/craintes sans qu'on doive
 * exposer `responses[]` complet dans le GET public.
 *
 * Pas d'auth : on ne renvoie que la réponse correspondant au code
 * fourni. Sans connaître un code, on ne peut rien extraire.
 */

import { getTenantSessions, maybeRunPurge } from '../../../../../../lib/tenants.js'
import { isValidTenantId } from '../../../../../../lib/validate.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { tenantId, sessionId } = req.query
  if (!isValidTenantId(tenantId)) {
    return res.status(400).json({ error: 'invalid_tenantId' })
  }
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 200) {
    return res.status(400).json({ error: 'invalid_sessionId' })
  }

  const { code } = req.body || {}
  if (!code || typeof code !== 'string' || code.length > 50) {
    return res.status(400).json({ error: 'invalid_code' })
  }

  maybeRunPurge()

  try {
    const sessions = await getTenantSessions(tenantId)
    const sessionData = sessions[sessionId]
    if (!sessionData) {
      return res.status(404).json({ error: 'session_not_found' })
    }

    const response = (sessionData.responses || []).find((r) => r.id === code)
    if (!response) {
      return res.status(404).json({ error: 'response_not_found' })
    }

    // On ne renvoie que LA réponse correspondant au code fourni.
    // Pas de dump de l'ensemble.
    return res.status(200).json({
      id: response.id,
      needs: response.needs || [],
      fears: response.fears || [],
      submittedAt: response.submittedAt,
    })
  } catch (err) {
    console.error('tenant session lookup error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
