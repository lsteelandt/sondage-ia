/**
 * /super-admin/activity
 *
 * Liste paginée de tous les events analytics, plus récents en premier.
 * Filtre par tenant(s) possible.
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import SuperAdminLayout from '../../components/SuperAdmin/SuperAdminLayout'

const PAGE_SIZE = 50

function formatTs(iso) {
  if (!iso) return '—'
  var d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR')
}

function deviceEmoji(device) {
  if (device === 'mobile') return '📱'
  if (device === 'tablet') return '📱'
  if (device === 'bot') return '🤖'
  if (device === 'desktop') return '💻'
  return '❓'
}

function buildQuery(p, perPage, tenantIds) {
  var qs = '?page=' + p + '&perPage=' + perPage
  tenantIds.forEach(function (t) { qs += '&tenantId=' + encodeURIComponent(t) })
  return qs
}

function buildExportUrl(tenantIds) {
  var qs = ''
  tenantIds.forEach(function (t) { qs += '&tenantId=' + encodeURIComponent(t) })
  return '/api/super-admin/activity/export' + (qs ? '?' + qs.slice(1) : '')
}

export default function SuperAdminActivity() {
  const [events, setEvents] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState([]) // [{id, name}] pour le filtre
  const [selectedTenants, setSelectedTenants] = useState([]) // [] = tous

  useEffect(function () {
    loadTenants()
  }, [])

  useEffect(function () {
    load(0)
  }, [selectedTenants])

  async function loadTenants() {
    try {
      var res = await fetch('/api/super-admin/tenants')
      if (res.status === 401) {
        window.location.href = '/super-admin/login'
        return
      }
      if (!res.ok) return
      var d = await res.json()
      var list = (d.tenants || []).map(function (t) { return { id: t.id, name: t.name } })
      list.sort(function (a, b) { return a.name.localeCompare(b.name) })
      setTenants(list)
    } catch { /* silent */ }
  }

  async function load(p) {
    setLoading(true)
    try {
      var res = await fetch('/api/super-admin/activity' + buildQuery(p, PAGE_SIZE, selectedTenants))
      if (res.status === 401) {
        window.location.href = '/super-admin/login'
        return
      }
      if (!res.ok) throw new Error('HTTP ' + res.status)
      var d = await res.json()
      setEvents(d.events)
      setTotal(d.total)
      setHasMore(d.hasMore)
      setPage(p)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function toggleTenant(id) {
    if (selectedTenants.indexOf(id) >= 0) {
      setSelectedTenants(selectedTenants.filter(function (x) { return x !== id }))
    } else {
      setSelectedTenants(selectedTenants.concat([id]))
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const allSelected = selectedTenants.length === 0
  const exportHref = buildExportUrl(selectedTenants)

  return (
    <SuperAdminLayout active="activity">
      <Head>
        <title>Activité — Super-admin</title>
      </Head>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Activité</h1>
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">
            {total} event(s)
            {selectedTenants.length > 0 && ' · ' + selectedTenants.length + ' org.'}
          </span>
          <a
            href={exportHref}
            className="px-3 py-2 bg-transilio-electric/20 hover:bg-transilio-electric/30 text-white text-sm rounded-classic transition"
            title="Télécharger les events (filtrés) au format CSV"
          >
            ↓ Exporter CSV
          </a>
        </div>
      </div>

      {/* Filtre par organisation */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
        <div className="text-white/60 text-xs uppercase tracking-wide mb-2">Organisations</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={function () { setSelectedTenants([]) }}
            className={
              'text-xs px-2 py-1 rounded transition ' +
              (allSelected
                ? 'bg-transilio-electric text-white font-medium'
                : 'bg-white/5 hover:bg-white/10 text-white/60')
            }
          >
            Toutes ({tenants.length})
          </button>
          {tenants.map(function (t) {
            const active = selectedTenants.indexOf(t.id) >= 0
            return (
              <button
                key={t.id}
                onClick={function () { toggleTenant(t.id) }}
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
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center text-white/40 py-20">Aucun event pour ce filtre.</div>
      ) : (
        <>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-left">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Org.</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Referer</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Pays</th>
                  <th className="px-4 py-3 font-medium">Device</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Durée</th>
                </tr>
              </thead>
              <tbody>
                {events.map(function (ev, i) {
                  return (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-4 py-2 text-white/80 text-xs whitespace-nowrap">{formatTs(ev.ts)}</td>
                      <td className="px-4 py-2 text-white/60 text-xs">
                        {ev.type === 'pageview' ? '👁 vue' : '⏱ durée'}
                      </td>
                      <td className="px-4 py-2 text-white text-xs">
                        <code className="bg-white/5 px-1 rounded">{ev.path}</code>
                      </td>
                      <td className="px-4 py-2 text-white/60 text-xs">
                        {ev.tenantId
                          ? <code className="bg-white/5 px-1 rounded">{ev.tenantId}</code>
                          : <span className="text-white/30">—</span>}
                      </td>
                      <td className="px-4 py-2 text-white/60 text-xs hidden md:table-cell">
                        {ev.referer || 'direct'}
                      </td>
                      <td className="px-4 py-2 text-white/60 text-xs hidden sm:table-cell">
                        {ev.country || 'Unknown'}
                      </td>
                      <td className="px-4 py-2 text-white/60 text-xs">
                        {deviceEmoji(ev.device)} {ev.device}
                      </td>
                      <td className="px-4 py-2 text-white/60 text-xs hidden md:table-cell">
                        {ev.duration ? ev.duration + 's' : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={function () { if (page > 0) load(page - 1) }}
              disabled={page === 0}
              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-classic transition disabled:opacity-30"
            >
              ← Précédent
            </button>
            <span className="text-white/50 text-sm">
              Page {page + 1} / {totalPages}
            </span>
            <button
              onClick={function () { if (hasMore) load(page + 1) }}
              disabled={!hasMore}
              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-classic transition disabled:opacity-30"
            >
              Suivant →
            </button>
          </div>
        </>
      )}
    </SuperAdminLayout>
  )
}
