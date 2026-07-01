import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { HiOutlineClipboardList } from "react-icons/hi";

const ACTION_META = {
  LOGIN:             { label: 'Connexion',          color: 'bg-green-100 text-green-700',  icon: '🔐' },
  LOGIN_FAILED:      { label: 'Échec connexion',    color: 'bg-red-100 text-red-700',      icon: '🚫' },
  LOGOUT:            { label: 'Déconnexion',         color: 'bg-gray-100 text-gray-600',    icon: '🚪' },
  REGISTER:          { label: 'Inscription',         color: 'bg-blue-100 text-blue-700',    icon: '👤' },
  TOKEN_REFRESHED:   { label: 'Token renouvelé',    color: 'bg-purple-100 text-purple-700', icon: '🔄' },
  REPORT_CREATED:    { label: 'Signalement créé',   color: 'bg-yellow-100 text-yellow-700', icon: '📝' },
  REPORT_CONFIRMED:  { label: 'Signalement confirmé', color: 'bg-teal-100 text-teal-700',  icon: '✅' },
  REPORT_VALIDATED:  { label: 'Signalement validé', color: 'bg-green-100 text-green-700',  icon: '✔️' },
  REPORT_REJECTED:   { label: 'Signalement rejeté', color: 'bg-red-100 text-red-700',      icon: '❌' },
  REPORT_RESOLVED:   { label: 'Signalement résolu', color: 'bg-green-100 text-green-700',  icon: '🏁' },
  MISSION_CREATED:   { label: 'Mission créée',      color: 'bg-indigo-100 text-indigo-700', icon: '🎯' },
  MISSION_COMPLETED: { label: 'Mission terminée',   color: 'bg-indigo-100 text-indigo-700', icon: '🏅' },
  INFRACTION_RECORDED: { label: 'Infraction',       color: 'bg-orange-100 text-orange-700', icon: '⚖️' },
  PRICE_IMPORTED:    { label: 'Import prix',         color: 'bg-blue-100 text-blue-700',    icon: '📂' },
  ACCESS_DENIED:     { label: 'Accès refusé',        color: 'bg-red-100 text-red-700',      icon: '🔒' },
  INVALID_TOKEN:     { label: 'Token invalide',      color: 'bg-red-100 text-red-700',      icon: '⚠️' },
}

const CATEGORIES = {
  'Tous':        null,
  'Auth':        ['LOGIN','LOGIN_FAILED','LOGOUT','REGISTER','TOKEN_REFRESHED'],
  'Signalements':['REPORT_CREATED','REPORT_CONFIRMED','REPORT_VALIDATED','REPORT_REJECTED','REPORT_RESOLVED'],
  'Terrain':     ['MISSION_CREATED','MISSION_COMPLETED','INFRACTION_RECORDED'],
  'Admin':       ['PRICE_IMPORTED'],
  'Sécurité':    ['ACCESS_DENIED','INVALID_TOKEN'],
}

const DEMO_LOGS = [
  { id:1,  action:'LOGIN',             userEmail:'admin@marketwatch.sn',     ipAddress:'192.168.1.10', details:'Connexion réussie',               createdAt:'2026-06-22T08:14:22' },
  { id:2,  action:'REPORT_CREATED',    userEmail:'moussa.ka@gmail.com',       ipAddress:'10.0.0.5',    details:'Priorité CRITICAL — Riz brisé',   createdAt:'2026-06-22T08:22:05', resource:'REPORT', resourceId:47 },
  { id:3,  action:'LOGIN_FAILED',      userEmail:'inconnu@test.com',          ipAddress:'41.82.34.11', details:'Tentative échouée',               createdAt:'2026-06-22T08:30:11' },
  { id:4,  action:'REPORT_VALIDATED',  userEmail:'agent.dci@marketwatch.sn', ipAddress:'192.168.1.12', details:'Validé après vérification terrain', createdAt:'2026-06-22T09:01:33', resource:'REPORT', resourceId:47 },
  { id:5,  action:'PRICE_IMPORTED',    userEmail:'admin@marketwatch.sn',     ipAddress:'192.168.1.10', details:'128 prix importés, 3 ignorés',    createdAt:'2026-06-22T09:15:00' },
  { id:6,  action:'TOKEN_REFRESHED',   userEmail:'fatou.sy@gmail.com',        ipAddress:'10.22.1.8',   details:'Rotation du refresh token',       createdAt:'2026-06-22T09:28:47' },
  { id:7,  action:'INFRACTION_RECORDED', userEmail:'agent.dci@marketwatch.sn', ipAddress:'192.168.1.12', details:'Amende 50 000 FCFA — Marché Sandaga', createdAt:'2026-06-22T10:02:19', resource:'INFRACTION', resourceId:12 },
  { id:8,  action:'REPORT_REJECTED',   userEmail:'agent.dci@marketwatch.sn', ipAddress:'192.168.1.12', details:'Doublon détecté',                 createdAt:'2026-06-22T10:11:05', resource:'REPORT', resourceId:48 },
  { id:9,  action:'ACCESS_DENIED',     userEmail:'merchant@boutique.sn',      ipAddress:'41.82.99.5',  details:'Accès /api/admin refusé',         createdAt:'2026-06-22T10:25:33' },
  { id:10, action:'REGISTER',          userEmail:'nouveau@gmail.com',         ipAddress:'10.0.0.99',   details:'Nouveau compte : CONSUMER',       createdAt:'2026-06-22T10:44:00' },
  { id:11, action:'MISSION_CREATED',   userEmail:'admin@marketwatch.sn',     ipAddress:'192.168.1.10', details:'Mission Médina — Huile végétale', createdAt:'2026-06-22T11:00:00', resource:'MISSION', resourceId:8 },
  { id:12, action:'REPORT_CONFIRMED',  userEmail:'aminata.d@gmail.com',       ipAddress:'10.0.1.22',   details:'+3 pts — Confirmation communautaire', createdAt:'2026-06-22T11:15:22', resource:'REPORT', resourceId:47 },
  { id:13, action:'LOGIN',             userEmail:'moussa.ka@gmail.com',       ipAddress:'10.0.0.5',    details:'Connexion réussie',               createdAt:'2026-06-22T11:30:00' },
  { id:14, action:'REPORT_CREATED',    userEmail:'aminata.d@gmail.com',       ipAddress:'10.0.1.22',   details:'Priorité HIGH — Huile végétale',  createdAt:'2026-06-22T11:45:18', resource:'REPORT', resourceId:49 },
  { id:15, action:'LOGOUT',            userEmail:'admin@marketwatch.sn',     ipAddress:'192.168.1.10', details:'Déconnexion',                     createdAt:'2026-06-22T12:00:00' },
]

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
}

const PAGE_SIZE = 10

export default function AuditLogs() {
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState('Tous')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [expanded, setExpanded]   = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/audit-logs')
      .then(r => setLogs(r.data))
      .catch(() => setLogs(DEMO_LOGS))
      .finally(() => setLoading(false))
  }, [])

  // Filtres
  const filtered = logs.filter(l => {
    const catFilter = CATEGORIES[category]
    const matchCat  = !catFilter || catFilter.includes(l.action)
    const matchSearch = !search ||
      l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      l.ipAddress?.includes(search) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCSV() {
    const header = 'Date;Action;Utilisateur;IP;Ressource;ID;Détails'
    const rows = filtered.map(l =>
      `${fmtDate(l.createdAt)};${l.action};${l.userEmail || ''};${l.ipAddress || ''};${l.resource || ''};${l.resourceId || ''};${l.details || ''}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'audit_logs.csv'; a.click()
  }

  // KPIs rapides
  const today = new Date().toDateString()
  const todayLogs   = logs.filter(l => new Date(l.createdAt).toDateString() === today)
  const securityAlerts = logs.filter(l => ['LOGIN_FAILED','ACCESS_DENIED','INVALID_TOKEN'].includes(l.action))
  const uniqueIps   = new Set(logs.map(l => l.ipAddress)).size

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal d'audit</h1>
          <p className="text-gray-500 text-sm mt-1">Traçabilité complète de toutes les actions sensibles</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
          📊 Exporter CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '📋', label: 'Total logs', value: logs.length, color: 'bg-blue-50 border-blue-200' },
          { icon: '📅', label: "Aujourd'hui", value: todayLogs.length, color: 'bg-green-50 border-green-200' },
          { icon: '🚨', label: 'Alertes sécurité', value: securityAlerts.length, color: 'bg-red-50 border-red-200' },
          { icon: '🌐', label: 'IPs distinctes', value: uniqueIps, color: 'bg-purple-50 border-purple-200' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{icon}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-black text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {/* Catégories */}
        <div className="flex gap-2 flex-wrap">
          {Object.keys(CATEGORIES).map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {cat}
            </button>
          ))}
        </div>
        {/* Recherche */}
        <input
          type="text"
          placeholder="Rechercher par email, IP, action, détails..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
        />
        <p className="text-xs text-gray-400">{filtered.length} entrée(s) trouvée(s)</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Chargement...</div>
        ) : paginated.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Aucun log trouvé</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Date & Heure', 'Action', 'Utilisateur', 'Adresse IP', 'Ressource', 'Détails'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map(log => {
                    const meta = ACTION_META[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600', icon: '📌' }
                    const isExpanded = expanded === log.id
                    return (
                      <tr key={log.id}
                          onClick={() => setExpanded(isExpanded ? null : log.id)}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                            ['LOGIN_FAILED','ACCESS_DENIED','INVALID_TOKEN'].includes(log.action)
                              ? 'bg-red-50/30' : ''
                          }`}>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                          {fmtDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate" title={log.userEmail}>
                          {log.userEmail || <span className="text-gray-400 italic">anonyme</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.ipAddress}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {log.resource ? `${log.resource} #${log.resourceId}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px] truncate" title={log.details}>
                          {log.details || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginated.map(log => {
                const meta = ACTION_META[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600', icon: '📌' }
                return (
                  <div key={log.id}
                       onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                       className={`p-4 cursor-pointer hover:bg-gray-50 ${
                         ['LOGIN_FAILED','ACCESS_DENIED','INVALID_TOKEN'].includes(log.action) ? 'bg-red-50/30' : ''
                       }`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(log.createdAt).split(' ')[1]}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{log.userEmail || 'anonyme'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>🌐 {log.ipAddress}</span>
                      {log.resource && <span>📄 {log.resource} #{log.resourceId}</span>}
                    </div>
                    {expanded === log.id && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                        {log.details}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} / {totalPages} — {filtered.length} entrées
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
              ← Préc.
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-sm ${page === n ? 'bg-gray-800 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                  {n}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
              Suiv. →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
