import { useEffect, useState } from 'react'
import api from '../../api/axios'

const STATUS_META = {
  PENDING:  { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  VERIFIED: { label: 'Vérifié',    color: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: 'Résolu',     color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejeté',     color: 'bg-gray-100 text-gray-500' },
}
const PRIORITY_META = {
  LOW:      { label: 'Faible',    color: 'bg-gray-100 text-gray-600' },
  NORMAL:   { label: 'Normale',   color: 'bg-blue-100 text-blue-700' },
  HIGH:     { label: 'Élevée',    color: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Critique',  color: 'bg-red-100 text-red-700' },
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MerchantReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [statusFilter, setStatusFilter] = useState('Tous')

  useEffect(() => {
    api.get('/merchant/reports')
      .then(r => setReports(r.data))
      .catch(() => setError("Impossible de charger les signalements pour le moment."))
      .finally(() => setLoading(false))
  }, [])

  const filtered = statusFilter === 'Tous'
    ? reports
    : reports.filter(r => r.status === statusFilter)

  const activeCount = reports.filter(r => r.status === 'PENDING' || r.status === 'VERIFIED').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Signalements reçus</h1>
        <p className="text-gray-500 text-sm mt-1">
          Anomalies de prix signalées par des consommateurs concernant votre boutique.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total reçus',   value: reports.length, color: 'bg-blue-50 border-blue-200' },
          { label: 'Actifs',        value: activeCount,     color: 'bg-yellow-50 border-yellow-200' },
          { label: 'Critiques',     value: reports.filter(r => r.priority === 'CRITICAL').length, color: 'bg-red-50 border-red-200' },
          { label: 'Résolus',       value: reports.filter(r => r.status === 'RESOLVED').length, color: 'bg-green-50 border-green-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${color}`}>
            <span className="text-xs text-gray-500">{label}</span>
            <p className="text-2xl font-black text-gray-800 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        {['Tous', ...Object.keys(STATUS_META)].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s === 'Tous' ? 'Tous' : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Chargement...</div>
        ) : error ? (
          <div className="py-12 text-center text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            {reports.length === 0
              ? "Aucun signalement pour votre boutique pour le moment. C'est plutôt bon signe !"
              : "Aucun signalement pour ce filtre."}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(r => (
              <div key={r.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{r.productName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${PRIORITY_META[r.priority]?.color}`}>
                      {PRIORITY_META[r.priority]?.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_META[r.status]?.color}`}>
                      {STATUS_META[r.status]?.label}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-gray-600">
                    Prix constaté : <strong className="text-gray-800">{r.priceObserved} FCFA</strong>
                  </span>
                  {r.officialPrice != null && (
                    <span className="text-gray-400">
                      Prix officiel : {r.officialPrice} FCFA
                    </span>
                  )}
                </div>
                {r.description && (
                  <p className="text-sm text-gray-500 mt-2 italic">« {r.description} »</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Les signalements peuvent être contestés depuis votre espace « Prix officiels » en justifiant l'écart constaté.
      </p>
    </div>
  )
}
