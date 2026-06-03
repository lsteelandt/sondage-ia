/**
 * GET /api/tenant/[tenantId]/session/[sessionId]
 *   Renvoie la session + agrégats besoins/craintes pour le nuage de mots.
 *
 * POST /api/tenant/[tenantId]/session/[sessionId]
 *   Ajoute une réponse de sondage (anonyme) à la session.
 *
 * PAS d'auth requise pour les répondants. L'isolation par tenant est
 * garantie par le chemin : on lit/écrit uniquement dans le fichier de
 * ce tenant.
 */

import { getTenantSessions, writeTenantSessions, recordActivity, maybeRunPurge } from '../../../../../lib/tenants.js'
import { isValidTenantId } from '../../../../../lib/validate.js'

export default async function handler(req, res) {
  const { tenantId, sessionId } = req.query

  if (!isValidTenantId(tenantId)) {
    return res.status(400).json({ error: 'invalid_tenantId' })
  }
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 200) {
    return res.status(400).json({ error: 'invalid_sessionId' })
  }
  maybeRunPurge()

  try {
    const sessions = await getTenantSessions(tenantId)

    if (req.method === 'GET') {
      const sessionData = sessions[sessionId]
      if (!sessionData) {
        return res.status(404).json({ error: 'session_not_found' })
      }

      // Agrégats besoins/craintes pour le nuage de mots
      const needsAgg = {}
      const fearsAgg = {}
      ;(sessionData.responses || []).forEach((response) => {
        ;(response.needs || []).forEach((word) => {
          needsAgg[word] = (needsAgg[word] || 0) + 1
        })
        ;(response.fears || []).forEach((word) => {
          fearsAgg[word] = (fearsAgg[word] || 0) + 1
        })
      })

      return res.status(200).json({
        id: sessionData.id,
        label: sessionData.label,
        createdAt: sessionData.createdAt,
        participantCount: sessionData.participantCount || 0,
        responses: sessionData.responses || [],
        keywords: {
          attentes: needsAgg,
          craintes: fearsAgg,
        },
        normalizedKeywords: sessionData.normalizedKeywords || null,
      })
    }

    if (req.method === 'POST') {
      const sessionData = sessions[sessionId]
      if (!sessionData) {
        return res.status(404).json({ error: 'session_not_found' })
      }

      const body = req.body || {}
      const response = {
        id: body.id || 'UNKNOWN',
        submittedAt: new Date().toISOString(),
        needs: body.needs || [],
        fears: body.fears || [],
      }

      if (!sessions[sessionId].responses) {
        sessions[sessionId].responses = []
      }
      sessions[sessionId].responses.push(response)
      sessions[sessionId].participantCount = sessions[sessionId].responses.length

      await writeTenantSessions(tenantId, sessions)
      // Best-effort : on garde la trace de la dernière activité sondé.
      recordActivity(tenantId, { kind: 'respondent', code: response.id, sessionId })
      return res.status(201).json({ success: true, id: response.id })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    console.error('tenant session API error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
