/**
 * DEPRECATED — voir /api/tenant/[tenantId]/sessions.
 */
export default function handler(req, res) {
  return res.status(410).json({
    error: 'gone',
    message: 'Cet endpoint est obsolète. Utilisez /api/tenant/[tenantId]/sessions.',
  })
}
