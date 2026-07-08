import { useEffect, useState } from 'react'
import api from '../../api/axios'
import ResponsiveTable from '../../components/ResponsiveTable'
import { statutLabel, prioriteLabel } from '../../utils/labels'

const STATUSES = ['PENDING','VERIFIED','RESOLVED','REJECTED']
const PRIORITIES = ['CRITICAL','HIGH','NORMAL','LOW']

const DEMO_REPORTS = [
  { id: 1, productName: 'Riz brisé local', merchantName: 'Boutique Al-Amine', regionName: 'Dakar', priceObserved: 500, officialPrice: 410, priority: 'HIGH',     status: 'PENDING',  createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 2, productName: 'Huile végétale',  merchantName: 'Supermarché Dial Diali', regionName: 'Dakar', priceObserved: 1450, officialPrice: 1000, priority: 'CRITICAL', status: 'VERIFIED', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 3, productName: 'Sucre cristallisé', merchantName: 'Épicerie Moussa Ba', regionName: 'Dakar', priceObserved: 750, officialPrice: 600, priority: 'HIGH',     status: 'PENDING',  createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 4, productName: 'Riz importé',     merchantName: 'Boutique Al-Amine', regionName: 'Dakar', priceObserved: 540, officialPrice: 500, priority: 'NORMAL',   status: 'RESOLVED', createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 5, productName: 'Riz brisé local', merchantName: 'Commerce Fatou Ndiaye', regionName: 'Thiès', priceObserved: 440, officialPrice: 430, priority: 'LOW',      status: 'PENDING',  createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 6, productName: 'Pain baguette',   merchantName: 'Supermarché Dial Diali', regionName: 'Dakar', priceObserved: 175, officialPrice: 150, priority: 'NORMAL',   status: 'PENDING',  createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: 7, productName: 'Lait en poudre',  merchantName: 'Épicerie Moussa Ba', regionName: 'Dakar', priceObserved: 4200, officialPrice: 3500, priority: 'CRITICAL', status: 'VERIFIED', createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
]

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    api.get('/reports?' + params)
      .then(r => { setReports(r.data); setIsDemo(false); setLoading(false) })
      .catch(err => {
        console.warn('Backend indisponible, passage en mode démo :', err.message)
        // Fallback : données de démonstration (comme MyReports.jsx)
        let demo = DEMO_REPORTS
        if (filters.status)   demo = demo.filter(r => r.status === filters.status)
        if (filters.priority) demo = demo.filter(r => r.priority === filters.priority)
        setReports(demo)
        setIsDemo(true)
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [filters])

  const updateStatus = async (id, status) => {
    await api.patch(`/reports/${id}/status`, { status })
    load()
  }

  const reportColumns = [
    { header: '#', accessor: 'id', tdClass: 'text-gray-400 text-xs', cell: r => `#${r.id}` },
    { header: 'Produit', accessor: 'productName', tdClass: 'font-medium' },
    { header: 'Commerçant', accessor: 'merchantName', tdClass: 'text-gray-500 text-xs', cell: r => (r.merchantName || '–') },
    { header: 'Région', accessor: 'regionName', tdClass: 'text-gray-500 text-xs' },
    { header: 'Obs.', accessor: 'priceObserved', tdClass: 'font-semibold text-red-600', cell: r => Math.round(r.priceObserved) + ' F' },
    { header: 'Officiel', accessor: 'officialPrice', tdClass: 'text-gray-500', cell: r => (r.officialPrice ? Math.round(r.officialPrice) + ' F' : '–') },
    { header: 'Écart', accessor: 'ecart', tdClass: 'font-bold text-xs', cell: r => {
        const ecart = r.officialPrice > 0 ? ((r.priceObserved - r.officialPrice) / r.officialPrice * 100).toFixed(1) : null
        return ecart !== null ? (<span className={ecart > 0 ? 'text-red-600' : 'text-green-600'}>{ecart > 0 ? '+' : ''}{ecart}%</span>) : '–'
      } },
    { header: 'Priorité', accessor: 'priority', tdClass: '', cell: r => <span className={`inline-block px-2 py-1 text-xs rounded-full ${r.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : r.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{prioriteLabel(r.priority)}</span> },
    { header: 'Statut', accessor: 'status', tdClass: '', cell: r => <span className={`inline-block px-2 py-1 text-xs rounded-full ${r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : r.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : r.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{statutLabel(r.status)}</span> },
    { header: 'Date', accessor: 'createdAt', tdClass: 'text-gray-400 text-xs', cell: r => r.createdAt?.slice(0,10) },
    { header: 'Action', accessor: 'action', tdClass: '', cell: r => (
      <select onChange={e => updateStatus(r.id, e.target.value)} defaultValue="" className="px-2 py-1 border border-gray-300 rounded text-xs">
        <option value="" disabled>Changer...</option>
        {['PENDING','VERIFIED','RESOLVED','REJECTED'].map(s => <option key={s} value={s}>{statutLabel(s)}</option>)}
      </select>
    ) }
  ]

  if (loading) return <div className="text-gray-400 text-center py-20">Chargement...</div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des signalements</h2>
          <p className="text-gray-500 text-sm">{reports.length} signalement(s)</p>
        </div>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 mb-5 text-sm flex items-center justify-between">
          <span>Mode démonstration — Backend non joignable. Données fictives affichées.</span>
          <button onClick={load} className="text-amber-800 underline font-medium ml-4">Réessayer</button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="text-red-700 underline font-medium ml-4">Réessayer</button>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap gap-3">
        <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Tous statuts</option>
          {STATUSES.map(s => <option key={s} value={s}>{statutLabel(s)}</option>)}
        </select>
        <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Toutes priorités</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{prioriteLabel(p)}</option>)}
        </select>
        <button onClick={() => setFilters({ status: '', priority: '' })}
          className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm">Réinitialiser</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4">
          {reports.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Aucun signalement trouvé.</div>
          ) : (
            <ResponsiveTable columns={reportColumns} data={reports} />
          )}
        </div>
      </div>
    </div>
  )
}
