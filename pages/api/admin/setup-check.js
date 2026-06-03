/**
 * DEPRECATED — La création de tenant est maintenant self-service.
 */
export default function handler(req, res) {
  return res.status(410).json({
    error: 'gone',
    message: 'Cet endpoint est obsolète. La création de tenant est self-service via la landing.',
  })
}
