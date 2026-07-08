import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
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

/* ─── Marqueur coloré par conformité ─────────────────────────────── */
const markerIcon = (ecart) => {
  const color = ecart >= 20 ? '#ef4444' : ecart >= 10 ? '#f97316' : '#22c55e'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;background:${color};
      border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
  })
}

function EcartBadge({ ecart }) {
  if (ecart >= 20) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">Non conforme +{ecart}%</span>
  if (ecart >= 10) return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold">Suspect +{ecart}%</span>
  if (ecart > 0)   return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">Conforme +{ecart}%</span>
  return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">Conforme {ecart}%</span>
}

/* ════════════════════════════════════════════════════════════════════ */
export default function Compare() {
  const [regions,         setRegions]         = useState([])
  const [products,        setProducts]        = useState([])
  const [selectedRegion,  setSelectedRegion]  = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [compareData,     setCompareData]     = useState(null)
  const [loading,         setLoading]         = useState(false)
  const [viewMode,        setViewMode]        = useState('table')

  useEffect(() => {
    api.get('/regions').then(r => setRegions(r.data)).catch(() => setRegions([
      { id: 1, name: 'Dakar' }, { id: 2, name: 'Thiès' }, { id: 3, name: 'Saint-Louis' },
      { id: 4, name: 'Ziguinchor' }, { id: 5, name: 'Kaolack' },
    ]))
    api.get('/products').then(r => setProducts(r.data)).catch(() => setProducts([
      { id: 1, name: 'Riz brisé local' }, { id: 2, name: 'Huile végétale' },
      { id: 3, name: 'Sucre cristallisé' }, { id: 4, name: 'Pain ordinaire' },
      { id: 5, name: 'Lait en poudre' },
    ]))
  }, [])

  async function handleCompare() {
    if (!selectedRegion || !selectedProduct) return
    setLoading(true)
    try {
      const res = await api.get('/prices/compare', { params: { regionId: selectedRegion, productId: selectedProduct } })
      setCompareData(res.data)
    } catch {
      const productName = products.find(p => p.id === +selectedProduct)?.name || 'Produit'
      const regionName  = regions.find(r => r.id === +selectedRegion)?.name || 'Région'
      setCompareData({
        product: productName, region: regionName, officialPrice: 500, unit: 'kg',
        merchants: [
          { name: 'Épicerie Fatou',      address: 'Marché Sandaga',    price: 490, ecart: -2,  lat: 14.6737, lng: -17.4441 },
          { name: 'Supermarché Auchan',  address: 'Route de Ouakam',   price: 555, ecart: +11, lat: 14.7012, lng: -17.4620 },
          { name: 'Boutique Mamadou',    address: 'HLM Grand Yoff',    price: 600, ecart: +20, lat: 14.7120, lng: -17.4530 },
          { name: 'Cash & Carry Diallo', address: 'Zone Industrielle', price: 480, ecart: -4,  lat: 14.6880, lng: -17.4400 },
          { name: 'Épicerie Al Amine',   address: 'Médina',            price: 510, ecart: +2,  lat: 14.6980, lng: -17.4500 },
          { name: 'Marché Tilène',       address: 'Rue 21, Médina',    price: 530, ecart: +6,  lat: 14.6905, lng: -17.4473 },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const merchants   = compareData?.merchants ?? []
  const minPrice    = merchants.length ? Math.min(...merchants.map(m => m.price)) : 0
  const maxPrice    = merchants.length ? Math.max(...merchants.map(m => m.price)) : 0
  const avgPrice    = merchants.length ? Math.round(merchants.reduce((s, m) => s + m.price, 0) / merchants.length) : 0
  const nbCritique  = merchants.filter(m => m.ecart >= 20).length
  const mapCenter   = merchants.filter(m => m.lat).length
    ? [merchants.filter(m=>m.lat).reduce((s,m)=>s+m.lat,0)/merchants.filter(m=>m.lat).length,
       merchants.filter(m=>m.lat).reduce((s,m)=>s+m.lng,0)/merchants.filter(m=>m.lat).length]
    : [14.6937, -17.4441]

  const barData = [...merchants].sort((a,b)=>a.price-b.price).map(m=>({
    name: m.name.length > 14 ? m.name.slice(0,14)+'…' : m.name,
    'Prix pratiqué': m.price,
    'Prix officiel': compareData?.officialPrice,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Comparateur de prix</h2>
        <p className="text-gray-500 text-sm mt-1">Comparez les prix par localisation et identifiez les anomalies.</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Sélectionnez un produit et une localisation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Région / Ville</label>
            <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">-- Choisir une région --</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Produit</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">-- Choisir un produit --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleCompare} disabled={!selectedRegion || !selectedProduct || loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? 'Recherche…' : 'Comparer les prix'}
            </button>
          </div>
        </div>
      </div>

      {/* Résultats */}
      {compareData && (
        <div className="space-y-4">

          {/* Bannière résumé */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-bold">{compareData.product}</h3>
                <p className="text-blue-200 text-sm"> {compareData.region} · {merchants.length} commerces comparés</p>
              </div>
              <div className="text-right">
                <p className="text-blue-300 text-xs">Prix officiel DCI</p>
                <p className="text-2xl font-bold">{compareData.officialPrice} <span className="text-lg font-normal">F/{compareData.unit}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Prix min',    value: `${minPrice} F` },
                { label: 'Prix moyen', value: `${avgPrice} F` },
                { label: 'Prix max',   value: `${maxPrice} F` },
                { label: 'Critiques',  value: `${nbCritique} commerce(s)` },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-blue-200">{s.label}</p>
                  <p className="font-bold text-sm mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Alerte critique */}
          {nbCritique > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <div>
                <p className="font-bold text-red-800">Dépassement critique détecté !</p>
                <p className="text-red-600 text-sm mt-0.5">
                  {merchants.filter(m => m.ecart >= 20).map(m => m.name).join(', ')} pratique(nt) un prix supérieur de +20% au prix officiel. Une mission de contrôle est recommandée.
                </p>
              </div>
            </div>
          )}

          {/* Onglets */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[['table','Tableau'],['bar','Graphique'],['map','Carte']].map(([mode, label]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${viewMode === mode ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TABLE ─── */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Rang','Commerce','Adresse','Prix (FCFA)','Écart'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...merchants].sort((a,b)=>a.price-b.price).map((m, i) => (
                      <tr key={i} className={`hover:bg-gray-50 ${i === 0 ? 'bg-green-50/60' : m.ecart >= 20 ? 'bg-red-50/40' : ''}`}>
                        <td className="px-4 py-3 text-center text-lg">
                          <span className={i === 0 ? 'font-bold text-green-700' : 'text-gray-400 text-sm'}>{i+1}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{m.name}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{m.address}</td>
                        <td className="px-4 py-3 font-bold text-gray-800">{m.price.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3"><EcartBadge ecart={m.ecart} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-3 p-4">
                {[...merchants].sort((a,b)=>a.price-b.price).map((m, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${i===0?'border-green-200 bg-green-50':m.ecart>=20?'border-red-200 bg-red-50':'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{i+1}.</span>
                          <p className="font-semibold text-gray-800 text-sm">{m.name}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{m.address}</p>
                      </div>
                      <EcartBadge ecart={m.ecart} />
                    </div>
                    <p className="font-bold text-gray-800 mt-2">{m.price.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GRAPHIQUE ─── */}
          {viewMode === 'bar' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Prix pratiqués vs prix officiel ({compareData.officialPrice} FCFA)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0}/>
                  <YAxis tick={{ fontSize: 11 }} domain={['auto','auto']}/>
                  <Tooltip formatter={v => `${v.toLocaleString('fr-FR')} FCFA`}/>
                  <Legend verticalAlign="top"/>
                  <ReferenceLine y={compareData.officialPrice} stroke="#1d4ed8" strokeDasharray="4 2"
                    label={{ value: 'Officiel', position: 'right', fontSize: 10, fill: '#1d4ed8' }}/>
                  <Bar dataKey="Prix officiel" fill="#bfdbfe" radius={[3,3,0,0]}/>
                  <Bar dataKey="Prix pratiqué" fill="#1d4ed8" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-2"> Ligne pointillée = seuil prix officiel</p>
            </div>
          )}

          {/* ── CARTE ─── */}
          {viewMode === 'map' && (
            <div className="space-y-3">
              {/* Légende */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap gap-3 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Légende :</span>
                <span>Conforme (&lt;10%)</span>
                <span>Suspect (10–19%)</span>
                <span>Non conforme (≥20%)</span>
              </div>

              {/* Carte Leaflet */}
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '400px' }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {merchants.filter(m => m.lat && m.lng).map((m, i) => (
                    <Marker key={i} position={[m.lat, m.lng]} icon={markerIcon(m.ecart)}>
                      <Popup>
                        <div className="text-sm min-w-[180px]">
                          <p className="font-bold text-gray-800 mb-1">{m.name}</p>
                          <p className="text-xs text-gray-500 mb-2">{m.address}</p>
                          <div className="flex justify-between bg-gray-50 rounded-lg px-3 py-2 mb-2">
                            <div>
                              <p className="text-xs text-gray-400">Constaté</p>
                              <p className="font-bold text-red-600">{m.price.toLocaleString('fr-FR')} F</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Officiel</p>
                              <p className="font-bold text-green-700">{compareData.officialPrice.toLocaleString('fr-FR')} F</p>
                            </div>
                          </div>
                          <div className="text-center"><EcartBadge ecart={m.ecart} /></div>
                        </div>
                      </Popup>
                      {m.ecart >= 20 && (
                        <Circle center={[m.lat, m.lng]} radius={300}
                          pathOptions={{ color:'#ef4444', fillColor:'#ef4444', fillOpacity:0.08, weight:2, dashArray:'5 5' }}/>
                      )}
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Récap sous la carte — responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...merchants].sort((a,b)=>a.price-b.price).map((m, i) => (
                  <div key={i} className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 shadow-sm
                    ${m.ecart>=20?'border-red-200':m.ecart>=10?'border-orange-200':'border-gray-100'}`}>
                    <span className="text-gray-400 text-sm font-semibold flex-shrink-0">{i+1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm truncate">{m.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.address}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-800 text-sm">{m.price.toLocaleString('fr-FR')} F</p>
                      <EcartBadge ecart={m.ecart} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* État vide */}
      {!compareData && !loading && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500 font-medium">Sélectionnez un produit et une région pour lancer la comparaison</p>
          <p className="text-gray-400 text-sm mt-1">Résultats disponibles en tableau, graphique ou carte interactive.</p>
        </div>
      )}
    </div>
  )
}
