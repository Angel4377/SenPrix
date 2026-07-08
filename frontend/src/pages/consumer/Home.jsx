import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function ConsumerHome() {
  const navigate = useNavigate()
  const [prices, setPrices] = useState([])
  const [regions, setRegions] = useState([])
  const [region, setRegion] = useState('Dakar')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')

  useEffect(() => {
    api.get('/regions').then(r => setRegions(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/prices?region=' + encodeURIComponent(region)).then(r => setPrices(r.data))
  }, [region])

  const categories = ['Tous', ...new Set(prices.map(p => p.category))]
  const filteredPrices = prices.filter(p => {
    const matchCategory = selectedCategory === 'Tous' || p.category === selectedCategory
    const matchSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  const getConformityStatus = (p) => {
    if (!p.officialPrice) return { label: 'Non référencé', color: 'bg-gray-400' }
    const ecart = ((p.price - p.officialPrice) / p.officialPrice * 100)
    if (ecart >= 20) return { label: 'Non conforme', color: 'bg-red-500' }
    if (ecart >= 10) return { label: 'Suspect', color: 'bg-yellow-500' }
    return { label: 'Conforme', color: 'bg-green-500' }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Contenu */}
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Accueil &amp; Prix officiels</h2>
          <p className="text-gray-500 text-sm mt-1">Consultez les prix réglementés par la DCI pour votre région.</p>
        </div>

        {/* CTA mobile — Signaler une anomalie */}
        <button
          onClick={() => navigate('/consumer/report')}
          className="w-full mb-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-md transition-colors"
        >
          <div className="text-left">
            <p className="text-base font-bold">Signaler une anomalie</p>
            <p className="text-teal-200 text-xs font-normal">Prix trop élevé dans votre marché ?</p>
          </div>
          <span className="ml-auto text-xl">→</span>
        </button>

        {/* Barre de recherche */}
        <div className="mb-6">
          <input 
            type="text"
            placeholder="Rechercher un produit, un marché..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-teal-500 text-base shadow-sm"
          />
        </div>

        {/* Sélecteur région */}
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <select 
            value={region} 
            onChange={e => setRegion(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium cursor-pointer hover:border-teal-400"
          >
            {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <span className="text-sm text-gray-500">{filteredPrices.length} produit(s)</span>
        </div>

        {/* Filtres par catégorie */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedCategory === cat 
                  ? 'bg-teal-700 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Liste des produits */}
        <div className="space-y-3 mb-4">
          {filteredPrices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
            </div>
          ) : (
            filteredPrices.map(p => {
              const status = getConformityStatus(p)
              const ecart = p.officialPrice ? ((p.price - p.officialPrice) / p.officialPrice * 100).toFixed(1) : null
              return (
                <div key={p.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900">{p.productName}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Réf. <span className="font-semibold text-gray-800">{Math.round(p.officialPrice)} FCFA</span>
                      </p>
                      <p className="text-gray-700 font-medium mt-1">
                        Observé : <span className={`font-bold ${parseFloat(ecart) >= 20 ? 'text-red-600' : parseFloat(ecart) >= 10 ? 'text-orange-600' : 'text-gray-900'}`}>
                          {Math.round(p.price)} / {p.unit}
                        </span>
                      </p>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <span className={`${status.color} text-white px-4 py-2 rounded-full text-xs font-bold inline-block whitespace-nowrap`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
