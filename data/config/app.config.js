const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Sondage IA',
  URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  SESSION_COOKIE_NAME: 'survey_admin_session',
  SESSION_MAX_AGE: 30 * 60 * 1000, // 30 minutes
}

module.exports = { APP_CONFIG }
