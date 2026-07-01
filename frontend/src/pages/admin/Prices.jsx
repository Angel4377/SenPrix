import { useEffect, useState } from 'react'
import api from '../../api/axios'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function AdminPrices() {
  const [prices, setPrices] = useState([])
  const [products, setProducts] = useState([])
  const [regions, setRegions] = useState([])
  const [form, setForm] = useState({ productId: '', regionId: '', price: '', validFrom: new Date().toISOString().slice(0,10) })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/prices/all').then(r => setPrices(r.data))
    api.get('/products').then(r => setProducts(r.data))
    api.get('/regions').then(r => setRegions(r.data))
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/admin/prices', form)
      setMsg('✅ Prix mis à jour avec succès !')
      api.get('/prices/all').then(r => setPrices(r.data))
      setForm({ ...form, price: '' })
    } catch { setMsg('❌ Erreur lors de la mise à jour.') }
  }

  const categories = [...new Set(prices.map(p => p.category))].sort()

  const priceColumns = [
    { header: 'Produit', accessor: 'productName', tdClass: 'font-medium text-gray-800' },
    { header: 'Unité', accessor: 'unit', tdClass: 'text-gray-500 text-xs' },
    { header: 'Région', accessor: 'regionName', tdClass: 'text-gray-600 text-xs' },
    { header: 'Prix FCFA', accessor: 'price', tdClass: 'font-bold text-green-700', cell: r => <span className="font-bold text-green-700">{Math.round(r.price)} F</span> },
    { header: 'Depuis', accessor: 'validFrom', tdClass: 'text-gray-400 text-xs' }
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion de la Mercuriale</h2>
        <p className="text-gray-500 text-sm">Prix officiels réglementés par produit et région</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">➕ Définir un prix officiel</h3>
        {msg && <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${msg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Produit *</label>
            <select required value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Sélectionner...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Région *</label>
            <select required value={form.regionId} onChange={e => setForm({...form, regionId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Sélectionner...</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prix (FCFA) *</label>
            <input type="number" required min="1" value={form.price}
              onChange={e => setForm({...form, price: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="450" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input type="date" value={form.validFrom} onChange={e => setForm({...form, validFrom: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">
            💾 Enregistrer
          </button>
        </form>
      </div>

      {/* Prices table */}
      {categories.map(cat => (
        <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cat}</span>
          </div>
          <div className="p-4">
            <ResponsiveTable columns={priceColumns} data={prices.filter(p => p.category === cat)} />
          </div>
        </div>
      ))}
    </div>
  )
}
