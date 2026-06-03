/**
 * Migration transilio : déplace l'existant single-tenant vers le nouveau modèle multi-tenant.
 *
 * Ce script est IDEMPOTENT : il peut être ré-exécuté sans casse.
 * Il ne SUPPRIME les fichiers d'origine qu'après vérification de la copie.
 *
 * Usage:
 *   node scripts/migrate-to-tenants.js
 *
 * À exécuter UNE SEULE FOIS, après approbation du plan lead-magnet et avant
 * tout refactor des endpoints. Si déjà exécuté, le script détecte l'état
 * migré et sort proprement.
 */

const fs = require('fs/promises')
const path = require('path')
const fssync = require('fs')

const DATA_DIR = path.join(process.cwd(), 'data')
const TENANTS_DIR = path.join(DATA_DIR, 'tenants')
const TRANSILIO_DIR = path.join(TENANTS_DIR, 'transilio')
const TRANSILIO_TENANT = path.join(TRANSILIO_DIR, 'tenant.json')
const TRANSILIO_SESSIONS = path.join(TRANSILIO_DIR, 'sessions.json')
const LEGACY_SESSIONS = path.join(DATA_DIR, 'sessions.json')
const LEGACY_ADMIN = path.join(DATA_DIR, 'admin.json')

const TRANSILIO_EMAIL = 'luc.steelandt@transilio.fr'

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf-8'))
}

async function chmod600(p) {
  // Conserve les permissions 600 comme le reste du dossier data/.
  // Si le fichier vient d'être créé, son umask est appliquée. On force 600.
  try {
    await fs.chmod(p, 0o600)
  } catch (err) {
    // non-fatal : on log et on continue
    console.warn(`  ! chmod 600 a échoué sur ${p}: ${err.message}`)
  }
}

function logHeader(msg) {
  console.log(`\n=== ${msg} ===`)
}

async function main() {
  logHeader('Migration SondageIntro → multi-tenant')
  console.log(`DATA_DIR = ${DATA_DIR}`)

  // --- 0. Garde : si déjà migré, sortir proprement ---
  if (await exists(TRANSILIO_TENANT)) {
    console.log('✓ Tenant "transilio" déjà migré. Aucune action.')
    if (await exists(LEGACY_SESSIONS)) {
      console.log('  → data/sessions.json existe encore : suppression possible en Phase 7.')
    }
    if (await exists(LEGACY_ADMIN)) {
      console.log('  → data/admin.json existe encore : suppression possible en Phase 7.')
    }
    process.exit(0)
  }

  // --- 1. Lire l'existant (best-effort) ---
  let legacySessions = {}
  let legacyAdmin = null
  let sessionsFound = false
  let adminFound = false

  if (await exists(LEGACY_SESSIONS)) {
    legacySessions = await readJson(LEGACY_SESSIONS)
    sessionsFound = true
    const count = Object.keys(legacySessions).length
    console.log(`✓ data/sessions.json trouvé : ${count} session(s)`)
  } else {
    console.log('• data/sessions.json absent (rien à migrer côté sessions)')
  }

  if (await exists(LEGACY_ADMIN)) {
    legacyAdmin = await readJson(LEGACY_ADMIN)
    adminFound = true
    console.log('✓ data/admin.json trouvé (sera archivé, plus utilisé)')
  } else {
    console.log('• data/admin.json absent (rien à migrer côté auth)')
  }

  if (!sessionsFound && !adminFound) {
    console.log('\nAucune donnée legacy. Création du tenant transilio vide.')
  }

  // --- 2. Créer la structure data/tenants/transilio/ ---
  logHeader('Création du tenant transilio')
  await fs.mkdir(TRANSILIO_DIR, { recursive: true })
  console.log(`✓ ${TRANSILIO_DIR}/`)

  // --- 3. Écrire tenant.json ---
  // On préserve un createdAt cohérent avec la date de la première session si possible.
  let earliestCreatedAt = null
  for (const id of Object.keys(legacySessions)) {
    const s = legacySessions[id]
    if (s && s.createdAt) {
      if (!earliestCreatedAt || s.createdAt < earliestCreatedAt) {
        earliestCreatedAt = s.createdAt
      }
    }
  }
  const createdAt = earliestCreatedAt || new Date().toISOString()

  const tenant = {
    id: 'transilio',
    name: 'Transilio (interne)',
    email: TRANSILIO_EMAIL,
    createdAt,
    magicLinks: {},
  }
  await fs.writeFile(
    TRANSILIO_TENANT,
    JSON.stringify(tenant, null, 2) + '\n',
    'utf-8'
  )
  await chmod600(TRANSILIO_TENANT)
  console.log(`✓ ${path.relative(process.cwd(), TRANSILIO_TENANT)}`)
  console.log(`  id        = ${tenant.id}`)
  console.log(`  email     = ${tenant.email}`)
  console.log(`  createdAt = ${tenant.createdAt}`)

  // --- 4. Copier sessions.json ---
  logHeader('Migration des sessions')
  if (sessionsFound) {
    await fs.writeFile(
      TRANSILIO_SESSIONS,
      JSON.stringify(legacySessions, null, 2) + '\n',
      'utf-8'
    )
    await chmod600(TRANSILIO_SESSIONS)
    const count = Object.keys(legacySessions).length
    const totalResponses = Object.values(legacySessions).reduce(
      (sum, s) => sum + ((s && s.responses) ? s.responses.length : 0),
      0
    )
    console.log(`✓ ${path.relative(process.cwd(), TRANSILIO_SESSIONS)}`)
    console.log(`  ${count} session(s), ${totalResponses} réponse(s) au total`)
  } else {
    // Créer un fichier vide pour cohérence
    await fs.writeFile(
      TRANSILIO_SESSIONS,
      JSON.stringify({}, null, 2) + '\n',
      'utf-8'
    )
    await chmod600(TRANSILIO_SESSIONS)
    console.log(`✓ ${path.relative(process.cwd(), TRANSILIO_SESSIONS)} (vide)`)
  }

  // --- 5. Vérification ---
  logHeader('Vérification de la copie')
  const verifyTenant = await readJson(TRANSILIO_TENANT)
  const verifySessions = await readJson(TRANSILIO_SESSIONS)
  if (verifyTenant.id !== 'transilio') {
    throw new Error(`tenant.json corrompu : id != transilio`)
  }
  const sessionCount = Object.keys(verifySessions).length
  if (sessionsFound && sessionCount !== Object.keys(legacySessions).length) {
    throw new Error(
      `Nombre de sessions mismatch : source ${Object.keys(legacySessions).length} vs cible ${sessionCount}`
    )
  }
  console.log(`✓ tenant.json valide`)
  console.log(`✓ sessions.json : ${sessionCount} session(s)`)

  // --- 6. Résumé + instructions pour la phase suivante ---
  logHeader('Migration terminée')
  console.log('Actions réalisées :')
  console.log('  • data/tenants/transilio/tenant.json créé')
  console.log('  • data/tenants/transilio/sessions.json créé')
  console.log('')
  console.log('Actions RESTANTES (à faire en Phase 7 après validation manuelle) :')
  if (sessionsFound) {
    console.log('  • Supprimer data/sessions.json (uniquement après test manuel)')
  }
  if (adminFound) {
    console.log('  • Supprimer data/admin.json (uniquement après test manuel)')
  }
  console.log('')
  console.log('PROCHAINE ÉTAPE : Phase 1 (modèle tenant + auth helper).')
  console.log('Tester manuellement : node -e "console.log(require(\'./data/tenants/transilio/tenant.json\'))"')
}

main().catch((err) => {
  console.error('\n✗ Migration échouée :', err.message)
  console.error(err.stack)
  process.exit(1)
})
