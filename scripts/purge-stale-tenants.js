/**
 * Purge des tenants inactifs depuis plus de N jours.
 *
 * Usage :
 *   node scripts/purge-stale-tenants.js                    # seuil par défaut 30j
 *   node scripts/purge-stale-tenants.js --dry-run          # liste sans rien toucher
 *   node scripts/purge-stale-tenants.js --threshold-days=15
 *   node scripts/purge-stale-tenants.js --threshold-days=0  # tous les tenants (à éviter)
 *
 * Les tenants avec des réponses sont archivés dans data/archive/ ;
 * ceux sans réponse sont supprimés directement.
 *
 * Note : ce script charge lib/tenants.js via import() dynamique — pas besoin
 * de transpilation.
 */

const path = require('path')

;(async function () {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const tdArg = args.find(function (a) { return a.startsWith('--threshold-days=') })
  const thresholdDays = tdArg ? parseInt(tdArg.split('=')[1], 10) : 30
  if (dryRun) {
    console.log('--- DRY RUN : aucune modification ---')
  }
  console.log('Seuil :', thresholdDays, 'jours')

  let purgeStaleTenants
  try {
    // Import dynamique depuis la racine du projet — lib/tenants.js est un
    // module ESM (Next.js). On le charge tel quel.
    const url = 'file://' + path.join(process.cwd(), 'lib/tenants.js')
    const mod = await import(url)
    purgeStaleTenants = mod.purgeStaleTenants
  } catch (err) {
    console.error('Erreur de chargement de lib/tenants.js :', err.message)
    process.exit(1)
  }

  try {
    const report = await purgeStaleTenants({
      thresholdMs: thresholdDays * 24 * 60 * 60 * 1000,
      dryRun: dryRun,
    })
    printReport(report, dryRun)
  } catch (err) {
    console.error('Erreur pendant la purge :', err)
    process.exit(1)
  }
})()

function printReport(report, dryRun) {
  console.log('---')
  console.log('Tenants scannés :', report.scanned)
  console.log('Seuil activité  :', report.thresholdDate)
  if (report.purged.length) {
    console.log('Supprimés (sans réponse) :')
    report.purged.forEach(function (p) {
      console.log('  -', p.tenantId, '(dernière activité :', p.lastActivity || 'aucune', ')')
    })
  }
  if (report.archived.length) {
    console.log('Archivés (avec réponses) :')
    report.archived.forEach(function (a) {
      console.log('  -', a.tenantId, '→', a.archiveFile, '(dernière activité :', a.lastActivity || 'aucune', ')')
    })
  }
  if (report.errors.length) {
    console.log('Erreurs :')
    report.errors.forEach(function (e) {
      console.log('  -', e.tenantId, ':', e.message)
    })
  }
  if (!report.purged.length && !report.archived.length) {
    console.log('Aucun tenant à purger.')
  }
  if (dryRun && (report.purged.length || report.archived.length)) {
    console.log('(DRY RUN : aucun fichier modifié.)')
  }
}
