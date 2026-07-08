import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { statutLabel } from '../../utils/labels'

export default function AgentDashboard() {
  const [alerts, setAlerts] = useState([])
  const [missions, setMissions] = useState([])

  useEffect(() => {
    api.get('/reports/alerts').then(r => setAlerts(r.data))
    api.get('/agent/missions').then(r => setMissions(r.data.slice(0,4)))
  }, [])

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const stats = {
    aTraiter: alerts.filter(a => a.status === 'PENDING').length,
    sur7j: alerts.filter(a => a.createdAt && new Date(a.createdAt) >= sevenDaysAgo).length,
    tauxValidation: alerts.length ? Math.round(alerts.filter(a => a.status === 'VERIFIED' || a.status === 'RESOLVED').length / alerts.length * 100) : 0,
    marchesEnTension: new Set(alerts.filter(a => a.priority === 'CRITICAL' || a.priority === 'HIGH').map(a => a.merchantName || a.regionName)).size,
  }

  const updateStatus = async (id, status) => {
    await api.patch(`/reports/${id}/status`, { status })
    setAlerts(prev => prev.map(a => a.id === id ? {...a, status} : a))
  }

  // Score de risque (indicatif) et prédiction alignés sur l'écart au prix officiel
  const riskInfo = a => {
    const ecart = a.ecartPercent ?? (a.officialPrice > 0 ? ((a.priceObserved - a.officialPrice) / a.officialPrice * 100) : 0)
    const score = Math.max(0, Math.min(0.99, Math.abs(ecart) / 25))
    const prediction = ecart >= 20
      ? { label: 'Non conforme', cls: 'bg-red-100 text-red-700' }
      : ecart >= 10
      ? { label: 'Suspect', cls: 'bg-orange-100 text-orange-700' }
      : { label: 'Conforme', cls: 'bg-green-100 text-green-700' }
    return { ecart, score, prediction }
  }

  const sortedAlerts = [...alerts].sort((a, b) => riskInfo(b).score - riskInfo(a).score)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Espace agent de contrôle — file des anomalies</h2>
        <p className="text-gray-500 text-sm">Signalements priorisés par score de risque et suivi des missions terrain</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Anomalies à traiter', value: stats.aTraiter, text: 'text-red-600' },
          { label: 'Signalements (7 j)', value: stats.sur7j, text: 'text-blue-600' },
          { label: 'Taux de validation', value: `${stats.tauxValidation}%`, text: 'text-green-600' },
          { label: 'Marchés en tension', value: stats.marchesEnTension, text: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* File des anomalies priorisées */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Signalements priorisés par score de risque</h3>
            <Link to="/agent/missions" className="text-green-600 text-sm font-medium">Planifier →</Link>
          </div>
          {alerts.length === 0 ? (
            <div className="p-10 text-center text-gray-400">Aucune alerte active !</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['Produit','Marché','Prix observé','Écart','Score','Prédiction','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedAlerts.map(a => {
                    const { ecart, score, prediction } = riskInfo(a)
                    return (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{a.productName}</p>
                          <p className="text-xs text-gray-400">#{a.id} · {a.createdAt?.slice(0,10)}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{a.merchantName || a.regionName}</td>
                        <td className="px-4 py-3 font-bold text-gray-800">{Math.round(a.priceObserved)} F</td>
                        <td className={`px-4 py-3 font-semibold ${ecart >= 20 ? 'text-red-600' : ecart >= 10 ? 'text-orange-600' : 'text-green-600'}`}>
                          {ecart > 0 ? '+' : ''}{ecart.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-gray-600">{score.toFixed(2)}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${prediction.cls}`}>{prediction.label}</span></td>
                        <td className="px-4 py-3">
                          {a.status === 'PENDING' ? (
                            <div className="flex gap-1.5">
                              <button onClick={() => updateStatus(a.id, 'VERIFIED')}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg font-medium">Valider</button>
                              <button onClick={() => updateStatus(a.id, 'REJECTED')}
                                className="text-xs border border-gray-300 hover:border-red-300 hover:text-red-600 text-gray-600 px-2.5 py-1 rounded-lg font-medium">Rejeter</button>
                            </div>
                          ) : (
                            <span className={`badge badge-${a.status?.toLowerCase()}`}>{statutLabel(a.status)}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Missions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Mes missions</h3>
            <Link to="/agent/missions" className="text-green-600 text-sm font-medium">Gérer →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {missions.map(m => (
              <div key={m.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800">{m.title}</p>
                  <span className={`badge ${m.status === 'COMPLETED' ? 'badge-resolved' : m.status === 'IN_PROGRESS' ? 'badge-verified' : 'badge-pending'}`}>
                    {m.status === 'PLANNED' ? 'Planifiée' : m.status === 'IN_PROGRESS' ? 'En cours' : 'Terminée'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{m.regionName}</p>
                {m.scheduledDate && <p className="text-xs text-gray-400">{m.scheduledDate}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
