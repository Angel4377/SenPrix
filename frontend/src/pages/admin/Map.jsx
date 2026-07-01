import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../api/axios'

// Fix Leaflet icon avec Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', NORMAL: '#3b82f6', LOW: '#22c55e' }

const priorityIcon = (priority, selected = false) => L.divIcon({
  className: '',
  html: `<div style="
    width:${selected ? 22 : 16}px;height:${selected ? 22 : 16}px;border-radius:50%;
    background:${COLORS[priority] || '#6b7280'};
    border:${selected ? '3px solid #1e293b' : '2px solid white'};
    box-shadow:0 0 ${selected ? '8px' : '4px'} rgba(0,0,0,${selected ? '.5' : '.3'});
  "></div>`,
  iconSize: [selected ? 22 : 16, selected ? 22 : 16],
  iconAnchor: [selected ? 11 : 8, selected ? 11 : 8],
})

const merchantIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:4px;background:#15803d;border:2px solid white;
    box-shadow:0 0 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:11px;">🏪</div>`,
  iconSize: [20, 20], iconAnchor: [10, 10],
})

const STATUS_META = {
  PENDING:  { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  VERIFIED: { label: 'Vérifié',    color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  RESOLVED: { label: 'Résolu',     color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200'  },
  REJECTED: { label: 'Rejeté',     color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200'    },
}
const PRIORITY_META = {
  CRITICAL: { label: 'Critique', color: 'text-red-700',    bg: 'bg-red-100'    },
  HIGH:     { label: 'Élevée',   color: 'text-orange-700', bg: 'bg-orange-100' },
  NORMAL:   { label: 'Normale',  color: 'text-blue-700',   bg: 'bg-blue-100'   },
  LOW:      { label: 'Basse',    color: 'text-green-700',  bg: 'bg-green-100'  },
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) }
  catch { return iso }
}

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => { if (target) map.flyTo([target.lat, target.lng], 15, { duration: 0.8 }) }, [target, map])
  return null
}

/* ════════════════════════════════════════════════════════════════════ */
export default function AdminMap() {
  const [reports,        setReports]        = useState([])
  const [merchants,      setMerchants]      = useState([])
  const [filter,         setFilter]         = useState('ALL')
  const [statusFilter,   setStatusFilter]   = useState('ALL')
  const [selectedReport, setSelectedReport] = useState(null)
  const [validating,     setValidating]     = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [r, m] = await Promise.all([
        api.get('/reports').then(r => r.data.filter(x => x.lat && x.lng)),
        api.get('/merchants').then(r => r.data.filter(x => x.lat && x.lng)),
      ])
      setReports(r); setMerchants(m)
    } catch {
      setReports(DEMO_REPORTS); setMerchants(DEMO_MERCHANTS)
    }
  }

  async function quickValidate(id, status) {
    setValidating(id)
    try { await api.patch(`/reports/${id}/status`, { status }) } catch { /* demo */ }
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setSelectedReport(r => r?.id === id ? { ...r, status } : r)
    setValidating(null)
  }

  const filtered = reports.filter(r => {
    if (filter !== 'ALL' && r.priority !== filter) return false
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
    return true
  })

  const stats = {
    total:    reports.length,
    critical: reports.filter(r => r.priority === 'CRITICAL').length,
    high:     reports.filter(r => r.priority === 'HIGH').length,
    pending:  reports.filter(r => r.status === 'PENDING').length,
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Carte de surveillance</h2>
        <p className="text-gray-500 text-sm">Signalements géolocalisés · cliquez un marqueur pour valider</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Signalements', value: stats.total,    color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '📍' },
          { label: 'Critiques',    value: stats.critical, color: 'text-red-600',    bg: 'bg-red-50',    icon: '🚨' },
          { label: 'Haute prior.', value: stats.high,     color: 'text-orange-600', bg: 'bg-orange-50', icon: '⬆️' },
          { label: 'En attente',   value: stats.pending,  color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '🕐' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 flex items-center gap-3`}>
            <span className="text-xl">{s.icon}</span>
            <div>
              <p className={`text-2xl font-bold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-500">Priorité :</span>
        {['ALL','CRITICAL','HIGH','NORMAL','LOW'].map(p => (
          <button key={p} onClick={() => setFilter(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${filter === p ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}>
            {p === 'ALL' ? 'Tous' : p}
          </button>
        ))}
        <span className="text-xs font-medium text-gray-500 ml-2">Statut :</span>
        {['ALL','PENDING','VERIFIED','RESOLVED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
            {s === 'ALL' ? 'Tous' : STATUS_META[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Carte + Panneau côte à côte */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Carte */}
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 flex-1" style={{ height: '520px' }}>
          <MapContainer center={[14.6937, -17.4441]} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedReport?.lat && <FlyTo target={selectedReport} />}

            {filtered.map(r => (
              <Marker key={r.id} position={[r.lat, r.lng]}
                icon={priorityIcon(r.priority, selectedReport?.id === r.id)}
                eventHandlers={{ click: () => setSelectedReport(r) }}>
                <Popup>
                  <div className="text-sm min-w-[210px]">
                    <p className="font-bold text-gray-800 mb-0.5">{r.productName}</p>
                    <p className="text-xs text-gray-500 mb-2">📍 {r.regionName}{r.merchantName ? ' · ' + r.merchantName : ''}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-red-600">{Math.round(r.priceObserved)} F</span>
                      {r.officialPrice && <span className="text-gray-400 text-xs">officiel: {Math.round(r.officialPrice)} F</span>}
                      {r.officialPrice > 0 && (
                        <span className="text-xs font-bold" style={{ color: COLORS[r.priority] }}>
                          +{((r.priceObserved - r.officialPrice) / r.officialPrice * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mb-3 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_META[r.status]?.bg} ${STATUS_META[r.status]?.color}`}>
                        {STATUS_META[r.status]?.label ?? r.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_META[r.priority]?.bg} ${PRIORITY_META[r.priority]?.color}`}>
                        {PRIORITY_META[r.priority]?.label ?? r.priority}
                      </span>
                    </div>
                    {r.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button onClick={() => quickValidate(r.id, 'VERIFIED')} disabled={validating === r.id}
                          className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded disabled:opacity-50">
                          ✅ Vérifier
                        </button>
                        <button onClick={() => quickValidate(r.id, 'RESOLVED')} disabled={validating === r.id}
                          className="flex-1 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded disabled:opacity-50">
                          🏁 Résolu
                        </button>
                        <button onClick={() => quickValidate(r.id, 'REJECTED')} disabled={validating === r.id}
                          className="flex-1 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded disabled:opacity-50">
                          ❌ Rejeter
                        </button>
                      </div>
                    )}
                    {r.status !== 'PENDING' && (
                      <p className="text-xs text-gray-400 text-center">Traité · {fmtDate(r.createdAt)}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {filtered.filter(r => r.priority === 'CRITICAL').map(r => (
              <Circle key={`c-${r.id}`} center={[r.lat, r.lng]} radius={500}
                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1, dashArray: '4 3' }} />
            ))}

            {merchants.map(m => (
              <Marker key={`m-${m.id}`} position={[m.lat, m.lng]} icon={merchantIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold mb-1">🏪 {m.name}</p>
                    <p className="text-xs text-gray-500">{m.address}</p>
                    <p className={`text-xs mt-1 font-medium ${m.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                      {m.status === 'active' ? '✅ Actif' : '⛔ Inactif'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Panneau latéral de détail + validation */}
        {selectedReport ? (
          <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col" style={{ maxHeight: '520px' }}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-800 text-sm">Signalement #{selectedReport.id}</p>
                <p className="text-xs text-gray-400">{fmtDate(selectedReport.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 text-lg p-1 leading-none">✕</button>
            </div>

            {/* Contenu */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <p className="font-bold text-gray-800">{selectedReport.productName}</p>
                <p className="text-sm text-gray-500">
                  📍 {selectedReport.regionName}
                  {selectedReport.merchantName && <> · <strong>{selectedReport.merchantName}</strong></>}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-3 text-center">
                  <p className="text-xs text-gray-400">Prix constaté</p>
                  <p className="font-bold text-red-700 text-xl">{Math.round(selectedReport.priceObserved)}</p>
                  <p className="text-xs text-gray-400">FCFA</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-3 text-center">
                  <p className="text-xs text-gray-400">Prix officiel</p>
                  <p className="font-bold text-green-700 text-xl">
                    {selectedReport.officialPrice ? Math.round(selectedReport.officialPrice) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">FCFA</p>
                </div>
              </div>

              {selectedReport.officialPrice > 0 && (() => {
                const e = ((selectedReport.priceObserved - selectedReport.officialPrice) / selectedReport.officialPrice * 100).toFixed(1)
                return (
                  <div className={`rounded-xl px-4 py-3 text-center border ${+e>=20?'bg-red-50 border-red-200':+e>=10?'bg-orange-50 border-orange-200':'bg-yellow-50 border-yellow-200'}`}>
                    <p className="text-xs text-gray-500 mb-0.5">Écart au prix officiel</p>
                    <p className={`text-3xl font-black ${+e>=20?'text-red-700':+e>=10?'text-orange-700':'text-yellow-700'}`}>
                      {e > 0 ? '+' : ''}{e}%
                    </p>
                  </div>
                )
              })()}

              <div className="flex gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_META[selectedReport.status]?.bg} ${STATUS_META[selectedReport.status]?.color} ${STATUS_META[selectedReport.status]?.border}`}>
                  {STATUS_META[selectedReport.status]?.label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_META[selectedReport.priority]?.bg} ${PRIORITY_META[selectedReport.priority]?.color}`}>
                  {PRIORITY_META[selectedReport.priority]?.label}
                </span>
              </div>

              {selectedReport.description && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700 italic">"{selectedReport.description}"</p>
                </div>
              )}

              {selectedReport.lat && (
                <p className="text-xs text-gray-400">📡 {selectedReport.lat.toFixed(4)}, {selectedReport.lng.toFixed(4)}</p>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valider / Changer le statut</p>
              <button onClick={() => quickValidate(selectedReport.id, 'VERIFIED')}
                disabled={validating === selectedReport.id || selectedReport.status === 'VERIFIED'}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                ✅ Marquer comme Vérifié
              </button>
              <button onClick={() => quickValidate(selectedReport.id, 'RESOLVED')}
                disabled={validating === selectedReport.id || selectedReport.status === 'RESOLVED'}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                🏁 Marquer comme Résolu
              </button>
              <button onClick={() => quickValidate(selectedReport.id, 'REJECTED')}
                disabled={validating === selectedReport.id || selectedReport.status === 'REJECTED'}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                ❌ Rejeter le signalement
              </button>
            </div>
          </div>
        ) : (
          /* Indice quand aucun signalement sélectionné */
          <div className="hidden lg:flex w-72 flex-shrink-0 bg-gray-50 rounded-xl border border-dashed border-gray-200 items-center justify-center text-center p-6">
            <div>
              <div className="text-4xl mb-3">👆</div>
              <p className="text-gray-500 font-medium text-sm">Cliquez un marqueur sur la carte</p>
              <p className="text-gray-400 text-xs mt-1">pour voir les détails et valider l'anomalie</p>
            </div>
          </div>
        )}
      </div>

      {/* Liste mobile sous la carte */}
      <div className="mt-4 lg:hidden space-y-2">
        <p className="font-semibold text-gray-700 text-sm">{filtered.length} signalement(s)</p>
        {filtered.slice(0, 6).map(r => (
          <button key={r.id} onClick={() => setSelectedReport(r)}
            className={`w-full text-left bg-white rounded-xl border px-4 py-3 flex items-center gap-3 shadow-sm
              ${selectedReport?.id === r.id ? 'border-blue-400' : 'border-gray-100 hover:border-gray-300'}`}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[r.priority] }} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 text-sm truncate">{r.productName}</p>
              <p className="text-xs text-gray-400 truncate">{r.regionName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-red-600 text-sm">{Math.round(r.priceObserved)} F</p>
              <p className={`text-xs font-medium ${STATUS_META[r.status]?.color}`}>{STATUS_META[r.status]?.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══ DONNÉES DEMO ═══ */
const DEMO_REPORTS = [
  { id: 1, productName: 'Riz brisé local', regionName: 'Dakar',       merchantName: 'Marché Sandaga',     priceObserved: 650,  officialPrice: 500,  priority: 'CRITICAL', status: 'PENDING',  lat: 14.6737, lng: -17.4441, createdAt: new Date(Date.now()-86400000*2).toISOString(), description: 'Prix affiché 650 FCFA au lieu de 500.' },
  { id: 2, productName: 'Huile végétale',  regionName: 'Dakar',       merchantName: 'Supermarché Auchan', priceObserved: 1200, officialPrice: 1000, priority: 'HIGH',     status: 'PENDING',  lat: 14.7012, lng: -17.4620, createdAt: new Date(Date.now()-86400000).toISOString(),   description: null },
  { id: 3, productName: 'Sucre blanc',     regionName: 'Thiès',       merchantName: 'Boutique Diallo',    priceObserved: 620,  officialPrice: 560,  priority: 'NORMAL',   status: 'VERIFIED', lat: 14.7900, lng: -16.9260, createdAt: new Date(Date.now()-86400000*3).toISOString(), description: null },
  { id: 4, productName: 'Pain ordinaire',  regionName: 'Saint-Louis', merchantName: null,                  priceObserved: 200,  officialPrice: 150,  priority: 'HIGH',     status: 'PENDING',  lat: 16.0198, lng: -16.4897, createdAt: new Date(Date.now()-3600000*5).toISOString(),  description: 'Boulangerie centrale.' },
  { id: 5, productName: 'Lait en poudre', regionName: 'Ziguinchor',  merchantName: 'Marché central',     priceObserved: 2500, officialPrice: 1900, priority: 'CRITICAL', status: 'PENDING',  lat: 12.5577, lng: -16.2719, createdAt: new Date(Date.now()-3600000*2).toISOString(),  description: null },
  { id: 6, productName: 'Riz importé',    regionName: 'Kaolack',     merchantName: 'Épicerie Tall',      priceObserved: 450,  officialPrice: 420,  priority: 'LOW',      status: 'RESOLVED', lat: 14.1480, lng: -16.0748, createdAt: new Date(Date.now()-86400000*5).toISOString(), description: null },
]
const DEMO_MERCHANTS = [
  { id: 1, name: 'Marché Sandaga',     address: 'Dakar Centre',    lat: 14.6740, lng: -17.4440, status: 'active' },
  { id: 2, name: 'Supermarché Auchan', address: 'Route de Ouakam', lat: 14.7015, lng: -17.4622, status: 'active' },
  { id: 3, name: 'Marché HLM',         address: 'Grand Yoff',      lat: 14.7090, lng: -17.4510, status: 'active' },
]
