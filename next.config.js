/**
 * Configuration Next.js — SondageIntro
 *
 * - reactStrictMode : comportements stricts en dev pour détecter les bugs
 * - headers         : headers de sécurité HTTP de base (M7 — voir pre-existing-security-gaps.md)
 *
 * Headers appliqués à toutes les routes (pages, API, _next/*) :
 *   - X-Frame-Options: DENY                              → bloque le clickjacking
 *   - X-Content-Type-Options: nosniff                    → bloque le MIME sniffing
 *   - Referrer-Policy: strict-origin-when-cross-origin   → limite la fuite de referer
 *   - Permissions-Policy                                 → désactive les APIs navigateur sensibles
 *   - Strict-Transport-Security                          → HSTS (prod uniquement)
 *   - Content-Security-Policy                            → verrouille les sources (cf. notes plus bas)
 *
 * La CSP ci-dessous est volontairement permissive car :
 *   1. Next.js Pages Router injecte des <script> inline + eval en dev (HMR) et
 *      en prod (framework runtime) → 'unsafe-inline' + 'unsafe-eval' requis
 *      tant qu'on n'utilise pas de nonce CSP.
 *   2. Google Fonts est chargé via @import dans styles/globals.css
 *      → on autorise fonts.googleapis.com (CSS) et fonts.gstatic.com (fichiers font).
 *   3. L'app n'utilise pas d'iframe ni de Web Worker.
 *   4. Toutes les images servies sont en self (/favicon.ico, /logo-transilio.png).
 *   5. Le tracker (components/Analytics/Tracker.js) ne fait que des fetch vers
 *      des chemins /api/track (self) — donc connect-src 'self' suffit.
 *   6. Le webhook sortant (lib/webhook.js) et les appels Mistral/OpenRouter/Ollama
 *      sont faits côté serveur (pages/api/tenant/[tenantId]/analyze.js) — la CSP
 *      du navigateur ne s'y applique pas, pas besoin d'autoriser ces hosts
 *      dans connect-src.
 *
 * Pour durcir ensuite (post-MVP) :
 *   - Migrer les <script> Next.js vers des nonces → retirer 'unsafe-inline' / 'unsafe-eval'
 *   - Supprimer l'import Google Fonts (auto-héberger les WOFF2)
 *   - Ajouter upgrade-insecure-requests / block-all-mixed-content
 */

const isProd = process.env.NODE_ENV === 'production'

// CSP : on élargit en dev pour ne pas casser le HMR de Next.js (WebSocket
// sur 'self' + eval libre). En prod on garde 'unsafe-inline' / 'unsafe-eval'
// pour les inline scripts du framework Pages Router (absence de nonce).
const cspDev = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const cspProd = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  {
    key: 'Content-Security-Policy',
    value: isProd ? cspProd : cspDev,
  },
]

if (isProd) {
  // HSTS : ne s'envoie qu'en prod. Les navigateurs l'ignorent sur localhost.
  // 2 ans + includeSubDomains + preload = éligible à la liste HSTS preload
  // (à soumettre sur https://hstspreload.org après audit).
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  })
}

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
