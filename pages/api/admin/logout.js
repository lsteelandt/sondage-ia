/**
 * DEPRECATED — voir /api/tenant/logout.
 */
export default function handler(req, res) {
  return res.status(410).json({
    error: 'gone',
    message: 'Cet endpoint est obsolète. Utilisez /api/tenant/logout.',
  })
}
