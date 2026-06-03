/**
 * GET  /api/tenant/[tenantId]/sessions       — liste les sessions (public)
 * POST /api/tenant/[tenantId]/sessions       — crée une session (admin auth)
 * DELETE /api/tenant/[tenantId]/sessions     — supprime une session (admin auth)
 *
 * GET est public (utilisé par le sondage).
 * POST/DELETE requièrent l'auth du tenant (cookie survey_session_${tenantId}).
 */

import { withMutex, maybeRunPurge } from '../../../../lib/tenants.js'
import { getTenantSessions, writeTenantSessions, recordActivity } from '../../../../lib/tenants.js'
import { isValidTenantId, isValidLabel } from '../../../../lib/validate.js'
import { requireTenantApi } from '../../../../lib/auth.js'
import { generateHexId, readJsonFile, writeJsonFile, chmod600Sync } from '../../../../lib/utils.js'
import path from 'path'

function generateSessionId() {
  return generateHexId(8)
}

export default async function handler(req, res) {
  const { tenantId } = req.query
  if (!isValidTenantId(tenantId)) {
    return res.status(400).json({ error: 'invalid_tenantId' })
  }
  maybeRunPurge()

  if (req.method === 'GET') {
    try {
      const sessions = await getTenantSessions(tenantId)
      return res.status(200).json(sessions || {})
    } catch (err) {
      console.error('list sessions error:', err)
      return res.status(500).json({ error: 'internal_error' })
    }
  }

  // POST + DELETE : auth requise
  const ctx = await requireTenantApi(req, res, tenantId)
  if (!ctx) return

  if (req.method === 'POST') {
    const { label } = req.body || {}
    if (!isValidLabel(label)) {
      return res.status(400).json({ error: 'invalid_label' })
    }
    try {
      const newSession = await withMutex(tenantId, async () => {
        const sessions = await getTenantSessions(tenantId)
        if (Object.keys(sessions).length >= 3) {
          const err = new Error('limit_reached')
          err.code = 'limit_reached'
          throw err
        }
        // 5 tentatives pour générer un ID non-collision
        let id
        for (let i = 0; i < 5; i += 1) {
          const candidate = generateSessionId()
          if (!sessions[candidate]) {
            id = candidate
            break
          }
        }
        if (!id) throw new Error('Could not generate unique sessionId')
        const session = {
          id,
          label: label.trim(),
          createdAt: new Date().toISOString(),
          participantCount: 0,
          responses: [],
        }
        sessions[id] = session
        await writeTenantSessions(tenantId, sessions)
        return session
      })
      recordActivity(tenantId, { kind: 'admin', email: ctx.tenant.email })
      return res.status(201).json(newSession)
    } catch (err) {
      if (err && err.code === 'limit_reached') {
        return res.status(400).json({
          error: 'limit_reached',
          message: 'Limite de 3 sondages atteinte. Si vous avez besoin de plus, contactez-nous à contact@transilio.fr',
        })
      }
      console.error('create session error:', err)
      return res.status(500).json({ error: 'internal_error' })
    }
  }

  if (req.method === 'DELETE') {
    const { sessionId } = req.body || {}
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'invalid_sessionId' })
    }
    try {
      await withMutex(tenantId, async () => {
        const sessions = await getTenantSessions(tenantId)
        if (!sessions[sessionId]) {
          // Pas trouvé : on renvoie quand même 200, idempotent
          return
        }
        delete sessions[sessionId]
        await writeTenantSessions(tenantId, sessions)
      })
      recordActivity(tenantId, { kind: 'admin', email: ctx.tenant.email })
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('delete session error:', err)
      return res.status(500).json({ error: 'internal_error' })
    }
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}
