/**
 * DEPRECATED — L'auth par mot de passe a été remplacée par magic link.
 * Voir /api/tenant/request-link + /api/tenant/consume-magic-link.
 */
export default function handler(req, res) {
  return res.status(410).json({
    error: 'gone',
    message: 'Cet endpoint est obsolète. Utilisez /api/tenant/request-link.',
  })
}
