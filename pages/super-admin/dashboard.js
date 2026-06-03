/**
 * /super-admin/dashboard
 *
 * Tableau de bord super-admin : liste tous les tenants avec dernière activité,
 * nuages de mots agrégés, bouton de purge, stats globales.
 * Authentifié via cookie `survey_superadmin`.
 */

import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import SuperAdminLayout from '../../components/SuperAdmin/SuperAdminLayout'

const SUSPEND_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000
const PROTECTED_IDS = ['transilio'] // Whitelist : ne jamais supprimer (espace interne)

function formatRelative(iso) {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (isNaN(t)) return '—'
  const delta = Date.now() - t
  if (delta < 0) return new Date(iso).toLocaleString('fr-FR')
  if (delta < 60 * 1000) return 'à l\'instant'
  if (delta < 60 * 60 * 1000) return Math.floor(delta / (60 * 1000)) + ' min'
  if (delta < 24 * 60 * 60 * 1000) return Math.floor(delta / (60 * 60 * 1000)) + ' h'
  if (delta < 30 * 24 * 60 * 60 * 1000) return Math.floor(delta / (24 * 60 * 60 * 1000)) + ' j'
  return new Date(iso).toLocaleDateString('fr-FR')
}

function statusBadge(lastActivity) {
  const t = lastActivity ? new Date(lastActivity.at).getTime() : 0
  if (!t) return { label: 'Inactif', color: 'bg-white/10 text-white/60' }
  if (Date.now() - t > SUSPEND_THRESHOLD_MS) {
    return { label: 'Suspendu', color: 'bg-transilio-red/20 text-red-200' }
  }
  return { label: 'Actif', color: 'bg-emerald-500/20 text-emerald-200' }
}

// Palette de couleurs pour empiler plusieurs tenants
const TENANT_COLORS = [
  'bg-transilio-electric/80',
  'bg-amber-400/80',
  'bg-emerald-400/80',
  'bg-pink-400/80',
  'bg-cyan-400/80',
  'bg-purple-400/80',
  'bg-orange-400/80',
  'bg-lime-400/80',
]

function ActivityBarChart({ byDay, byTenant, tenantIds }) {
  // byDay: { 'YYYY-MM-DD': count } — toujours présent (agrégat)
  // byTenant: optionnel, { tenantId: { day: count } } — pour empilement
  const days = []
  const today = new Date()
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ key, label: d.toLocaleDateString('fr-FR', { weekday: 'short' }) })
  }
  const max = Math.max(1, ...days.map(function (d) { return byDay[d.key] || 0 }))

  if (byTenant && tenantIds && tenantIds.length > 1) {
    // Mode empilé : un segment coloré par tenant
    return (
      <div>
        <div className="flex items-end gap-2 h-32">
          {days.map(function (d) {
            const segments = tenantIds.map(function (tid, idx) {
              const c = (byTenant[tid] && byTenant[tid][d.key]) || 0
              return { tid: tid, count: c, color: TENANT_COLORS[idx % TENANT_COLORS.length] }
            })
            const total = segments.reduce(function (s, x) { return s + x.count }, 0)
            return (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-24">
                  <div
                    className="w-full rounded-t overflow-hidden flex flex-col justify-end"
                    style={{ height: ((total / max) * 100) + '%', minHeight: total > 0 ? '4px' : '0' }}
                    title={total + ' events le ' + d.key}
                  >
                    {segments.slice().reverse().map(function (s) {
                      if (s.count === 0) return null
                      const segH = total > 0 ? (s.count / total) * 100 : 0
                      return (
                        <div
                          key={s.tid}
                          className={s.color}
                          style={{ height: segH + '%' }}
                          title={s.tid + ' : ' + s.count}
                        />
                      )
                    })}
                  </div>
                </div>
                <span className="text-xs text-white/50 capitalize">{d.label}</span>
                <span className="text-xs text-white/80 font-medium">{total}</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          {tenantIds.map(function (tid, idx) {
            return (
              <span key={tid} className="flex items-center gap-1.5">
                <span className={'inline-block w-3 h-3 rounded ' + TENANT_COLORS[idx % TENANT_COLORS.length]} />
                <code className="bg-white/5 px-1 rounded text-white/70">{tid}</code>
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  // Mode simple : une seule couleur
  return (
    <div className="flex items-end gap-2 h-32">
      {days.map(function (d) {
        const c = byDay[d.key] || 0
        const h = (c / max) * 100
        return (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end h-24">
              <div
                className="bg-transilio-electric/70 rounded-t"
                style={{ height: h + '%', minHeight: c > 0 ? '4px' : '0' }}
                title={c + ' events le ' + d.key}
              />
            </div>
            <span className="text-xs text-white/50 capitalize">{d.label}</span>
            <span className="text-xs text-white/80 font-medium">{c}</span>
          </div>
        )
      })}
    </div>
  )
}

function TenantFilterChips({ tenants, selected, onChange }) {
  // tenants: [{ id, name }]
  // selected: array of tenantId (vide = "tous")
  const allSelected = selected.length === 0
  function toggle(id) {
    if (selected.indexOf(id) >= 0) {
      onChange(selected.filter(function (x) { return x !== id }))
    } else {
      onChange(selected.concat([id]))
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={function () { onChange([]) }}
        className={
          'text-xs px-2 py-1 rounded transition ' +
          (allSelected
            ? 'bg-transilio-electric text-white font-medium'
            : 'bg-white/5 hover:bg-white/10 text-white/60')
        }
      >
        Tous ({tenants.length})
      </button>
      {tenants.map(function (t) {
        const active = selected.indexOf(t.id) >= 0
        return (
          <button
            key={t.id}
            onClick={function () { toggle(t.id) }}
            className={
              'text-xs px-2 py-1 rounded transition ' +
              (active
                ? 'bg-transilio-electric text-white font-medium'
                : 'bg-white/5 hover:bg-white/10 text-white/60')
            }
            title={t.name}
          >
            <code className="text-[10px] mr-1">{t.id}</code>
            {t.name}
          </button>
        )
      })}
    </div>
  )
}

function WordCloud({ agg, max = 12 }) {
  const items = Object.entries(agg || {})
    .sort(function (a, b) { return b[1] - a[1] })
    .slice(0, max)
  if (!items.length) return <p className="text-white/40 text-xs">Aucun mot</p>
  const top = items[0] ? items[0][1] : 1
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(function ([word, count]) {
        const ratio = count / top
        const size = 11 + Math.round(ratio * 12) // 11..23px
        const opacity = 0.5 + Math.round(ratio * 50) / 100
        return (
          <span
            key={word}
            className="px-2 py-0.5 bg-transilio-electric/20 text-white rounded"
            style={{ fontSize: size + 'px', opacity: opacity }}
            title={count + '×'}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}

function TenantDetailsModal({ tenant, onClose }) {
  if (!tenant) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0F1459] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={function (e) { e.stopPropagation() }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{tenant.name}</h2>
            <p className="text-white/60 text-sm">{tenant.email}</p>
            <p className="text-white/40 text-xs mt-1">tenantId : <code className="bg-white/5 px-1 rounded">{tenant.id}</code></p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
          <div className="bg-white/5 rounded p-3">
            <div className="text-white/50 text-xs">Sondages</div>
            <div className="text-white text-xl font-bold">{tenant.surveyCount}</div>
          </div>
          <div className="bg-white/5 rounded p-3">
            <div className="text-white/50 text-xs">Réponses</div>
            <div className="text-white text-xl font-bold">{tenant.responseCount}</div>
          </div>
          <div className="bg-white/5 rounded p-3">
            <div className="text-white/50 text-xs">Créé le</div>
            <div className="text-white text-xs">{tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('fr-FR') : '—'}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-white font-semibold mb-2 text-sm">Sondages</h3>
          {tenant.sessions.length === 0 ? (
            <p className="text-white/40 text-xs">Aucun sondage.</p>
          ) : (
            <ul className="space-y-1">
              {tenant.sessions.map(function (s) {
                return (
                  <li key={s.id} className="flex justify-between text-sm bg-white/5 rounded px-3 py-2">
                    <span className="text-white/80">{s.label}</span>
                    <span className="text-white/50 text-xs">
                      {s.participantCount} participant(s) · {s.id}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-white font-semibold mb-2 text-sm">Nuage besoins (mots bruts)</h3>
          <WordCloud agg={tenant.wordClouds.besoins} max={20} />
        </div>
        <div>
          <h3 className="text-white font-semibold mb-2 text-sm">Nuage craintes (mots bruts)</h3>
          <WordCloud agg={tenant.wordClouds.craintes} max={20} />
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ tenant, onConfirm, onCancel, busy, archive }) {
  if (!tenant) return null
  var isProtected = PROTECTED_IDS.indexOf(tenant.id) !== -1
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="bg-[#0F1459] border border-white/10 rounded-2xl max-w-md w-full p-6"
        onClick={function (e) { e.stopPropagation() }}
      >
        <h2 className="text-xl font-bold text-white mb-2">Supprimer cet espace ?</h2>
        <p className="text-white/80 text-sm mb-3">
          Vous allez supprimer <strong>{tenant.name}</strong> (<code className="bg-white/5 px-1 rounded text-xs">{tenant.id}</code>).
        </p>
        {isProtected ? (
          <div className="mb-4 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            Cet espace est protégé et ne peut pas être supprimé.
          </div>
        ) : (
          <>
            <p className="text-white/60 text-sm mb-4">
              {tenant.responseCount > 0
                ? 'Cet espace contient ' + tenant.responseCount + ' réponse(s).'
                : 'Cet espace n\'a aucune réponse.'}
              {' '}Vous pouvez choisir d'archiver les données dans <code className="bg-white/5 px-1 rounded text-xs">data/archive/</code> avant suppression (recommandé si vous voulez garder une trace), ou supprimer définitivement.
            </p>
          </>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-classic transition disabled:opacity-50"
          >
            Annuler
          </button>
          {!isProtected && (
            <>
              <button
                onClick={function () { onConfirm(true) }}
                disabled={busy}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-sm rounded-classic transition disabled:opacity-50"
              >
                {busy && archive ? 'Suppression…' : 'Archiver puis supprimer'}
              </button>
              <button
                onClick={function () { onConfirm(false) }}
                disabled={busy}
                className="px-4 py-2 bg-transilio-red hover:bg-red-700 text-white text-sm font-medium rounded-classic transition disabled:opacity-50"
              >
                {busy && !archive ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PurgeReportPanel({ report, onClose }) {
  if (!report) return null
  var hasCandidates = report.purged.length > 0 || report.archived.length > 0
  return (
    <div className="mt-3 bg-black/20 border border-white/10 rounded p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/70 font-medium">
          {report.dryRun ? 'Aperçu (aucune modification) — ' : 'Résultat — '}
          {report.purged.length + report.archived.length} tenant(s) concerné(s)
        </span>
        <button onClick={onClose} className="text-white/40 hover:text-white text-sm">×</button>
      </div>
      {!hasCandidates && <p className="text-white/50">Aucun tenant à purger.</p>}
      {report.purged.length > 0 && (
        <div className="mb-2">
          <div className="text-white/60 mb-1">Supprimés (sans réponse) :</div>
          <ul className="space-y-0.5">
            {report.purged.map(function (p) {
              return (
                <li key={p.tenantId} className="flex justify-between text-white/80">
                  <span><code className="bg-white/5 px-1 rounded">{p.tenantId}</code> {p.lastActivity ? '— dernière act. ' + formatRelative(p.lastActivity) : '— jamais actif'}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {report.archived.length > 0 && (
        <div>
          <div className="text-white/60 mb-1">Archivés (avec réponses) :</div>
          <ul className="space-y-0.5">
            {report.archived.map(function (a) {
              return (
                <li key={a.tenantId} className="flex justify-between text-white/80">
                  <span><code className="bg-white/5 px-1 rounded">{a.tenantId}</code> {a.lastActivity ? '— dernière act. ' + formatRelative(a.lastActivity) : ''}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {report.errors.length > 0 && (
        <div className="mt-2 text-red-300">
          {report.errors.length} erreur(s) : {report.errors.map(function (e) { return e.tenantId }).join(', ')}
        </div>
      )}
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [filter, setFilter] = useState('')
  const [chartTenants, setChartTenants] = useState([]) // [] = tous
  const [chartStats, setChartStats] = useState(null)   // { byDay, byTenant, totalPageviews }
  const [chartLoading, setChartLoading] = useState(false)
  const [detailsTenant, setDetailsTenant] = useState(null)
  const [purgeStatus, setPurgeStatus] = useState(null) // { kind: 'running' } | { kind: 'ok', report } | { kind: 'error', message }
  const [purgeReport, setPurgeReport] = useState(null)   // dernier rapport (persisté entre deux clics)
  const [deleteTarget, setDeleteTarget] = useState(null) // tenant à supprimer
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(function () {
    load()
  }, [])

  useEffect(function () {
    loadChart()
  }, [chartTenants])

  async function load() {
    setLoading(true)
    setAuthError('')
    try {
      var res = await fetch('/api/super-admin/tenants')
      if (res.status === 401) {
        window.location.href = '/super-admin/login'
        return
      }
      if (!res.ok) throw new Error('HTTP ' + res.status)
      var d = await res.json()
      setData(d)
    } catch (err) {
      setAuthError('Erreur de chargement : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadChart() {
    setChartLoading(true)
    try {
      var url = '/api/super-admin/stats/daily?days=7'
      if (chartTenants.length > 0) {
        chartTenants.forEach(function (t) { url += '&tenantId=' + encodeURIComponent(t) })
      }
      var res = await fetch(url)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      var d = await res.json()
      setChartStats(d)
    } catch {
      // silent — le graphique reste sur l'état précédent
    } finally {
      setChartLoading(false)
    }
  }

  async function runPurge(thresholdDays, dryRun) {
    setPurgeStatus({ kind: 'running' })
    try {
      var res = await fetch('/api/admin/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholdDays: thresholdDays, dryRun: !!dryRun }),
      })
      if (!res.ok) {
        var d = await res.json().catch(function () { return {} })
        setPurgeStatus({ kind: 'error', message: d.error || 'HTTP ' + res.status })
        return
      }
      var report = await res.json()
      setPurgeStatus({ kind: 'ok', report: report })
      setPurgeReport(report)
      if (!dryRun) load()
    } catch (err) {
      setPurgeStatus({ kind: 'error', message: err.message })
    }
  }

  async function confirmDelete(archive) {
    if (!deleteTarget) return
    setDeleteBusy(true)
    try {
      var res = await fetch('/api/super-admin/tenants/' + encodeURIComponent(deleteTarget.id) + '/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: !!archive }),
      })
      var d = await res.json().catch(function () { return {} })
      if (!res.ok) {
        setPurgeStatus({ kind: 'error', message: 'Suppression : ' + (d.error || 'HTTP ' + res.status) })
        setDeleteBusy(false)
        return
      }
      setDeleteTarget(null)
      setDeleteBusy(false)
      load()
    } catch (err) {
      setPurgeStatus({ kind: 'error', message: err.message })
      setDeleteBusy(false)
    }
  }

  const filteredTenants = useMemo(function () {
    if (!data) return []
    var q = filter.trim().toLowerCase()
    if (!q) return data.tenants
    return data.tenants.filter(function (t) {
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      )
    })
  }, [data, filter])

  return (
    <SuperAdminLayout active="dashboard">
      <Head>
        <title>Sondages externes — Super-admin</title>
      </Head>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : authError ? (
        <div className="text-center text-red-300 py-20">{authError}</div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Sondages externes</h1>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={filter}
                onChange={function (e) { setFilter(e.target.value) }}
                placeholder="Filtrer par nom, email, tenantId…"
                className="input-field !py-2 text-sm w-64"
              />
              <button
                onClick={load}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-classic transition"
                title="Recharger"
              >
                ↻
              </button>
            </div>
          </div>

          {/* Stats globales */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white/50 text-xs uppercase tracking-wide">Tenants</div>
                <div className="text-white text-2xl font-bold mt-1">{data.stats.totalTenants}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white/50 text-xs uppercase tracking-wide">Sondages</div>
                <div className="text-white text-2xl font-bold mt-1">{data.stats.totalSurveys}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white/50 text-xs uppercase tracking-wide">Réponses</div>
                <div className="text-white text-2xl font-bold mt-1">{data.stats.totalResponses}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-white/50 text-xs uppercase tracking-wide">Pageviews 7j</div>
                <div className="text-white text-2xl font-bold mt-1">{data.stats.totalPageviews7d}</div>
              </div>
            </div>
          )}

          {/* Activité 7j */}
          {data && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-white font-semibold text-sm">Activité analytics — 7 derniers jours</h2>
                  <p className="text-white/50 text-xs mt-0.5">
                    {chartStats ? chartStats.totalPageviews + ' pageview(s)' : '—'}
                    {chartTenants.length > 0 && ' · ' + chartTenants.length + ' organisation(s)'}
                  </p>
                </div>
                {chartLoading && <span className="text-white/40 text-xs">chargement…</span>}
              </div>
              <div className="mb-3">
                <TenantFilterChips
                  tenants={data.tenants}
                  selected={chartTenants}
                  onChange={setChartTenants}
                />
              </div>
              <ActivityBarChart
                byDay={chartStats ? chartStats.byDay : {}}
                byTenant={chartStats ? chartStats.byTenant : null}
                tenantIds={chartTenants}
              />
            </div>
          )}

          {/* Boutons purge */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <h2 className="text-white font-semibold text-sm">Purge des tenants inactifs (30j)</h2>
                <p className="text-white/50 text-xs mt-1">
                  Supprime les tenants sans réponse, archive ceux qui en ont.
                  {purgeStatus && purgeStatus.kind === 'ok' && purgeStatus.report && (
                    <span className="ml-2 text-emerald-300">
                      {purgeStatus.report.purged.length} supprimé(s), {purgeStatus.report.archived.length} archivé(s)
                    </span>
                  )}
                  {purgeStatus && purgeStatus.kind === 'error' && (
                    <span className="ml-2 text-red-300">Erreur : {purgeStatus.message}</span>
                  )}
                </p>
              </div>
              <button
                onClick={function () { runPurge(30, true) }}
                disabled={purgeStatus && purgeStatus.kind === 'running'}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-classic transition disabled:opacity-50"
                title="Simule la purge sans rien supprimer et affiche la liste des candidats"
              >
                {purgeStatus && purgeStatus.kind === 'running' ? '…' : 'Dry-run'}
              </button>
              <button
                onClick={function () {
                  if (window.confirm('Lancer la purge réelle ? Cette action est irréversible.')) {
                    runPurge(30, false)
                  }
                }}
                disabled={purgeStatus && purgeStatus.kind === 'running'}
                className="px-3 py-2 bg-transilio-red hover:bg-red-700 text-white text-sm font-medium rounded-classic transition disabled:opacity-50"
              >
                {purgeStatus && purgeStatus.kind === 'running' ? 'Purge…' : 'Lancer la purge'}
              </button>
            </div>
            <PurgeReportPanel report={purgeReport} onClose={function () { setPurgeReport(null) }} />
          </div>

          {/* Table des tenants */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-left">
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Tenant ID</th>
                  <th className="px-4 py-3 font-medium">Dernière activité</th>
                  <th className="px-4 py-3 font-medium text-right">Sond.</th>
                  <th className="px-4 py-3 font-medium text-right">Rép.</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-white/40 py-8">
                      Aucun tenant ne correspond au filtre.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(function (t) {
                    var st = statusBadge(t.lastActivity)
                    var actor = ''
                    if (t.lastActivity) {
                      if (t.lastActivity.kind === 'admin') {
                        actor = t.lastActivity.email || ''
                      } else if (t.lastActivity.kind === 'respondent') {
                        actor = t.lastActivity.code || ''
                      }
                    }
                    var isProtected = PROTECTED_IDS.indexOf(t.id) !== -1
                    return (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-white font-medium">
                          {t.name}
                          {isProtected && <span className="ml-2 text-xs text-amber-300/70" title="Espace interne protégé">🔒</span>}
                        </td>
                        <td className="px-4 py-3 text-white/70 hidden sm:table-cell">{t.email}</td>
                        <td className="px-4 py-3 text-white/50 hidden md:table-cell">
                          <code className="text-xs bg-white/5 px-1 rounded">{t.id}</code>
                        </td>
                        <td className="px-4 py-3 text-white/80">
                          <div>{formatRelative(t.lastActivity && t.lastActivity.at)}</div>
                          {actor && <div className="text-xs text-white/40">{actor}</div>}
                        </td>
                        <td className="px-4 py-3 text-white/80 text-right">{t.surveyCount}</td>
                        <td className="px-4 py-3 text-white/80 text-right">{t.responseCount}</td>
                        <td className="px-4 py-3">
                          <span className={'text-xs px-2 py-0.5 rounded ' + st.color}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={function () { setDetailsTenant(t) }}
                            className="text-transilio-electric hover:text-white text-xs font-medium mr-3"
                          >
                            Détails
                          </button>
                          {!isProtected && (
                            <button
                              onClick={function () { setDeleteTarget(t) }}
                              className="text-transilio-red hover:text-red-300 text-xs font-medium"
                            >
                              Supprimer
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailsTenant && (
        <TenantDetailsModal tenant={detailsTenant} onClose={function () { setDetailsTenant(null) }} />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          tenant={deleteTarget}
          busy={deleteBusy}
          onConfirm={confirmDelete}
          onCancel={function () { if (!deleteBusy) setDeleteTarget(null) }}
        />
      )}
    </SuperAdminLayout>
  )
}
