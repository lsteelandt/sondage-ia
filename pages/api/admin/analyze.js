/**
 * DEPRECATED — voir /api/tenant/[tenantId]/analyze.
 */
export default function handler(req, res) {
  return res.status(410).json({
    error: 'gone',
    message: 'Cet endpoint est obsolète. Utilisez /api/tenant/[tenantId]/analyze.',
  })
}
