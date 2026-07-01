import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

export default function AgentDashboard() {
  const [alerts, setAlerts] = useState([])
  const [missions, setMissions] = useState([])

  useEffect(() => {
    api.get('/reports/alerts').then(r => setAlerts(r.data))
    api.get('/agent/missions').then(r => setMissions(r.data.slice(0,4)))
  }, [])

  const stats = {
    critical: alerts.filter(a => a.priority === 'CRITICAL').length,
    high: alerts.filter(a => a.priority === 'HIGH').length,
    total: alerts.length,
    missions: missions.length,
  }

  const verify = async id => {
    await api.patch(`/reports/${id}/status`, { status: 'VERIFIED' })
    setAlerts(prev => prev.map(a => a.id === id ? {...a, status: 'VERIFIED'} : a))
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tableau de bord – Brigade de contrôle</h2>
        <p className="text-gray-500 text-sm">Alertes en temps réel et suivi des missions terrain</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Critiques', value: stats.critical, icon: '🚨', bg: 'bg-red-100', text: 'text-red-600' },
          { label: 'Haute priorité', value: stats.high, icon: '⬆️', bg: 'bg-orange-100', text: 'text-orange-600' },
          { label: 'Alertes actives', value: stats.total, icon: '🔔', bg: 'bg-yellow-100', text: 'text-yellow-600' },
          { label: 'Mes missions', value: stats.missions, icon: '🗺️', bg: 'bg-blue-100', text: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Alertes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">🚨 Alertes actives
              {stats.critical > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.critical} critiques</span>}
            </h3>
            <Link to="/agent/missions" className="text-green-600 text-sm font-medium">Planifier →</Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-10 text-center text-gray-400">✅ Aucune alerte active !</div>
            ) : alerts.map(a => {
              const ecart = a.officialPrice > 0 ? ((a.priceObserved - a.officialPrice) / a.officialPrice * 100).toFixed(1) : null
              return (
                <div key={a.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge badge-${a.priority?.toLowerCase()}`}>{a.priority}</span>
                        <span className="text-xs text-gray-400">#{a.id} · {a.createdAt?.slice(0,10)}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{a.productName}</p>
                      <p className="text-xs text-gray-500">📍 {a.regionName}{a.merchantName ? ' · ' + a.merchantName : ''}</p>
                      {a.description && <p className="text-xs text-gray-400 mt-1 italic">"{a.description.slice(0,80)}..."</p>}
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-bold text-red-600">{Math.round(a.priceObserved)} F</p>
                      {a.officialPrice && <p className="text-xs text-gray-400">off: {Math.round(a.officialPrice)} F</p>}
                      {ecart && <p className={`text-xs font-bold ${parseFloat(ecart) > 0 ? 'text-red-600' : 'text-green-600'}`}>+{ecart}%</p>}
                      {a.status === 'PENDING' && (
                        <button onClick={() => verify(a.id)}
                          className="mt-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                          Vérifier
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Missions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">🗺️ Mes missions</h3>
            <Link to="/agent/missions" className="text-green-600 text-sm font-medium">Gérer →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {missions.map(m => (
              <div key={m.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800">{m.title}</p>
                  <span className={`badge ${m.status === 'COMPLETED' ? 'badge-resolved' : m.status === 'IN_PROGRESS' ? 'badge-verified' : 'badge-pending'}`}>
                    {m.status === 'PLANNED' ? '📅 Planifiée' : m.status === 'IN_PROGRESS' ? '🔄 En cours' : '✅ Terminée'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">📍 {m.regionName}</p>
                {m.scheduledDate && <p className="text-xs text-gray-400">📆 {m.scheduledDate}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
