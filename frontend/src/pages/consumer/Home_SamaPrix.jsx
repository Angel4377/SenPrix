import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'

export default function ConsumerHome() {
  const [prices, setPrices] = useState([])
  const [regions, setRegions] = useState([])
  const [region, setRegion] = useState('Dakar')
  const [myReports, setMyReports] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')

  useEffect(() => {
    api.get('/regions').then(r => setRegions(r.data))
    api.get('/reports/my').then(r => setMyReports(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/prices?region=' + encodeURIComponent(region)).then(r => setPrices(r.data))
  }, [region])

  // Filtrer par catégorie et recherche
  const categories = ['Tous', ...new Set(prices.map(p => p.category))]
  const filteredPrices = prices.filter(p => {
    const matchCategory = selectedCategory === 'Tous' || p.category === selectedCategory
    const matchSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  // Déterminer le statut de conformité
  const getConformityStatus = (p) => {
    if (!p.officialPrice) return { label: 'Inconnu', color: 'bg-gray-500', icon: '?' }
    const ecart = ((p.price - p.officialPrice) / p.officialPrice * 100)
    if (ecart > 10) return { label: 'Suspect', color: 'bg-yellow-500', icon: '⚠' }
    if (ecart > 5) return { label: 'À surveiller', color: 'bg-orange-500', icon: '🔍' }
    if (ecart < -5) return { label: 'Conforme', color: 'bg-green-500', icon: '✓' }
    return { label: 'Conforme', color: 'bg-green-500', icon: '✓' }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* En-tête principal (style SamaPrix) */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">MarketWatch</h1>
            <p className="text-teal-100 text-sm">Surveillance participative des prix</p>
          </div>
          <p className="text-xl font-bold">Sénégal</p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto p-4">
        
        {/* Barre de recherche */}
        <div className="mt-6 mb-6">
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

        {/* Filtres par catégorie (style SamaPrix) */}
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
        <div className="space-y-3 mb-12">
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
                        Observé : <span className={`font-bold ${ecart > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {Math.round(p.price)} / {p.unit}
                        </span>
                      </p>
                    </div>
                    
                    {/* Badge de statut (style SamaPrix) */}
                    <div className="ml-4 flex-shrink-0">
                      <span className={`${status.color} text-white px-4 py-2 rounded-full text-xs font-bold inline-block whitespace-nowrap`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Navigation inférieure (optionnel) */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3">
          <Link to="/consumer/home" className="flex flex-col items-center text-teal-600 hover:text-teal-700 text-xs font-semibold">
            <span className="text-xl">🏠</span>
            Accueil
          </Link>
          <Link to="/consumer/compare" className="flex flex-col items-center text-gray-600 hover:text-teal-600 text-xs font-semibold">
            <span className="text-xl">🗺️</span>
            Carte
          </Link>
          <Link to="/consumer/report" className="flex flex-col items-center text-gray-600 hover:text-teal-600 text-xs font-semibold">
            <span className="text-xl">⚠️</span>
            Signaler
          </Link>
          <Link to="/consumer/gamification" className="flex flex-col items-center text-gray-600 hover:text-teal-600 text-xs font-semibold">
            <span className="text-xl">👤</span>
            Profil
          </Link>
        </div>
      </div>
    </div>
  )
}
