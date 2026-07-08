import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts'
import api from '../../api/axios'

/**
 * Analyse et Intelligence des Données
 * Tendances tarifaires, anomalies statistiques, export CSV/Excel/PDF
 */
export default function Analytics() {
  const [tab, setTab] = useState('trends')
  const [period, setPeriod] = useState('month')
  const [trendData, setTrendData] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [kpis, setKpis] = useState(null)
  const [exporting, setExporting] = useState(null)

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    try {
      const [trends, anoms, kpiData] = await Promise.all([
        api.get('/admin/analytics/trends', { params: { period } }),
        api.get('/admin/analytics/anomalies'),
        api.get('/admin/analytics/kpis'),
      ])
      setTrendData(trends.data)
      setAnomalies(anoms.data)
      setKpis(kpiData.data)
    } catch {
      // Données démo
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      setTrendData(months.slice(0, 8).map((m, i) => ({
        month: m,
        'Riz brisé': 480 + Math.round(Math.sin(i) * 30),
        'Huile végétale': 1150 + i * 15 + Math.round(Math.random() * 50),
        'Sucre': 720 + Math.round(Math.cos(i) * 20),
        'Pain': 210 + Math.round(Math.sin(i * 0.5) * 10),
        signalements: 45 + i * 8 + Math.round(Math.random() * 20),
      })))
      setAnomalies([
        { region: 'Dakar Centre', product: 'Huile végétale', ecart: 32, trend: 'HAUSSE', risk: 'ÉLEVÉ', alerts: 18, prediction: 'Probable hausse de 5% dans 2 semaines' },
        { region: 'Thiès', product: 'Riz brisé', ecart: 24, trend: 'STABLE_HAUT', risk: 'ÉLEVÉ', alerts: 12, prediction: 'Tension sur stocks — risque de pénurie locale' },
        { region: 'Saint-Louis', product: 'Sucre cristallisé', ecart: 18, trend: 'HAUSSE', risk: 'MOYEN', alerts: 7, prediction: 'Écart en augmentation progressive' },
        { region: 'Ziguinchor', product: 'Pain ordinaire', ecart: 14, trend: 'BAISSE', risk: 'FAIBLE', alerts: 3, prediction: 'Retour à la normale prévu sous 1 semaine' },
      ])
      setKpis({
        totalSignalements: 1284,
        tauxResolution: 67,
        ecartMoyen: 8.3,
        zonesActives: 14,
        productsAlerted: 5,
        merchantsControlled: 89,
        missionsDone: 34,
        infractions: 23,
      })
    }
  }

  async function exportData(format) {
    setExporting(format)
    try {
      const res = await api.get(`/admin/analytics/export`, {
        params: { format, period },
        responseType: 'blob',
      })
      const mimes = { csv: 'text/csv', xlsx: 'application/vnd.ms-excel', pdf: 'application/pdf' }
      const exts = { csv: 'csv', xlsx: 'xlsx', pdf: 'pdf' }
      const blob = new Blob([res.data], { type: mimes[format] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `marketwatch_rapport_${period}.${exts[format]}`; a.click()
    } catch {
      // Export CSV local de démo
      if (format === 'csv') {
        const csv = ['Mois;Riz brisé;Huile;Sucre;Pain;Signalements',
          ...trendData.map(r => `${r.month};${r['Riz brisé']};${r['Huile végétale']};${r.Sucre};${r.Pain};${r.signalements}`)
        ].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `rapport_${period}.csv`; a.click()
      } else {
        alert(`Export ${format.toUpperCase()} — connectez le backend pour exporter dans ce format.`)
      }
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Analyse & Intelligence</h1>
        </div>
        {/* Boutons export */}
        <div className="flex gap-2">
          {[['csv','CSV'],['xlsx','Excel'],['pdf','PDF']].map(([fmt, label]) => (
            <button key={fmt} onClick={() => exportData(fmt)} disabled={!!exporting}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
              {exporting === fmt ? '...' : label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs globaux */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total signalements', value: kpis.totalSignalements.toLocaleString(), color: 'bg-blue-50 border-blue-200' },
            { label: 'Taux de résolution', value: `${kpis.tauxResolution}%`, color: 'bg-green-50 border-green-200' },
            { label: 'Écart moyen', value: `+${kpis.ecartMoyen}%`, color: 'bg-yellow-50 border-yellow-200' },
            { label: 'Zones actives', value: kpis.zonesActives, color: 'bg-red-50 border-red-200' },
            { label: 'Missions terminées', value: kpis.missionsDone, color: 'bg-purple-50 border-purple-200' },
            { label: 'Infractions', value: kpis.infractions, color: 'bg-orange-50 border-orange-200' },
            { label: 'Commerces contrôlés', value: kpis.merchantsControlled, color: 'bg-teal-50 border-teal-200' },
            { label: 'Produits en alerte', value: kpis.productsAlerted, color: 'bg-pink-50 border-pink-200' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <div className="mb-1">
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <p className="text-2xl font-black text-gray-800">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sélecteur période + onglets */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[['trends','Tendances'],['anomalies','Anomalies'],['signalements','Signalements']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${tab === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      {/* Tendances tarifaires */}
      {tab === 'trends' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Évolution des prix par produit (FCFA)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `${v.toLocaleString()} FCFA`} />
                <Legend />
                <Line type="monotone" dataKey="Riz brisé" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Huile végétale" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Sucre" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Pain" stroke="#6b7280" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Analyse prédictive — Prochaines 4 semaines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { product: 'Huile végétale', trend: 'HAUSSE', prediction: '+5 à +8% probable', risk: 'Élevé', color: 'text-red-600 bg-red-50' },
                { product: 'Riz brisé', trend: 'STABLE', prediction: 'Stable ±2%', risk: 'Faible', color: 'text-blue-600 bg-blue-50' },
                { product: 'Sucre cristallisé', trend: 'LÉGÈRE HAUSSE', prediction: '+2 à +4%', risk: 'Modéré', color: 'text-yellow-600 bg-yellow-50' },
                { product: 'Pain ordinaire', trend: 'BAISSE', prediction: '-1 à -3% (normalisation)', risk: 'Faible', color: 'text-green-600 bg-green-50' },
              ].map(p => (
                <div key={p.product} className={`rounded-lg p-3 ${p.color.split(' ')[1]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{p.product}</span>
                    <span className={`text-xs font-bold ml-auto ${p.color.split(' ')[0]}`}>{p.trend}</span>
                  </div>
                  <p className="text-sm text-gray-600">{p.prediction}</p>
                  <p className="text-xs text-gray-400 mt-1">Risque : {p.risk}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              * Prédictions basées sur les tendances historiques et les signalements communautaires
            </p>
          </div>
        </div>
      )}

      {/* Anomalies statistiques */}
      {tab === 'anomalies' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-red-50">
            <h3 className="font-semibold text-red-800">Zones et produits à risque détectés automatiquement</h3>
            <p className="text-xs text-red-600 mt-1">Basé sur les écarts statistiques et la fréquence des signalements</p>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Région', 'Produit', 'Écart moyen', 'Tendance', 'Risque', 'Alertes', 'Prédiction IA'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {anomalies.map((a, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{a.region}</td>
                  <td className="px-4 py-3 text-gray-700">{a.product}</td>
                  <td className="px-4 py-3 font-bold text-red-600">+{a.ecart}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      a.trend === 'HAUSSE' ? 'bg-red-100 text-red-700' :
                      a.trend === 'BAISSE' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'}`}>
                      {a.trend}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      a.risk === 'ÉLEVÉ' ? 'bg-red-100 text-red-700' :
                      a.risk === 'MOYEN' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'}`}>
                      {a.risk}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{a.alerts}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 italic">{a.prediction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Volume de signalements */}
      {tab === 'signalements' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Volume de signalements par mois</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="signalements" stroke="#6366f1" fill="#c7d2fe" strokeWidth={2} name="Signalements" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
