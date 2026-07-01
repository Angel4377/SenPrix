import { useEffect, useState } from 'react'
import api from '../../api/axios'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function MerchantPrices() {
  const [prices, setPrices] = useState([])
  const [regions, setRegions] = useState([])
  const [region, setRegion] = useState('Dakar')

  // ── Vérificateur de conformité (D6) ──────────────────────────────────────
  const [checkProduct, setCheckProduct] = useState('')
  const [checkPrice, setCheckPrice]     = useState('')
  const [checkResult, setCheckResult]   = useState(null)

  function verifyConformity() {
    if (!checkProduct || !checkPrice) return
    const official = prices.find(p => p.productId === parseInt(checkProduct) || p.productName === checkProduct)
    if (!official) { setCheckResult({ status: 'INCONNU', msg: 'Prix officiel non disponible pour ce produit dans cette région.' }); return }
    const ecart = ((parseFloat(checkPrice) - official.price) / official.price) * 100
    if (ecart <= 0)       setCheckResult({ status: 'CONFORME',    ecart, official: official.price, color: 'green' })
    else if (ecart <= 5)  setCheckResult({ status: 'CONFORME',    ecart, official: official.price, color: 'green' })
    else if (ecart <= 10) setCheckResult({ status: 'VIGILANCE',   ecart, official: official.price, color: 'orange' })
    else                  setCheckResult({ status: 'INFRACTION',  ecart, official: official.price, color: 'red' })
  }

  useEffect(() => {
    api.get('/regions').then(r => setRegions(r.data))
  }, [])

  useEffect(() => {
    api.get('/prices?region=' + encodeURIComponent(region)).then(r => setPrices(r.data))
  }, [region])

  const categories = [...new Set(prices.map(p => p.category))].sort()

  const priceColumns = [
    { header: 'Produit', accessor: 'productName', tdClass: 'font-semibold text-gray-800' },
    { header: 'Unité', accessor: 'unit', tdClass: 'text-gray-500 text-xs' },
    { header: 'Prix officiel (FCFA)', accessor: 'price', tdClass: 'text-xl font-bold text-green-700', cell: r => (<div><span className="text-xl font-bold text-green-700">{Math.round(r.price)}</span><span className="text-gray-400 text-xs ml-1">FCFA</span></div>) },
    { header: 'Date de référence', accessor: 'validFrom', tdClass: 'text-gray-400 text-xs' },
    { header: 'Statut', accessor: 'status', tdClass: '', cell: () => <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">✅ En vigueur</span> }
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mercuriale officielle des prix</h2>
        <p className="text-gray-500 text-sm">Prix réglementés applicables dans votre région · Direction du Commerce Intérieur (DCI)</p>
      </div>

      {/* ── Vérificateur de conformité ────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
        <h3 className="font-semibold text-gray-700 mb-1">🔍 Vérifier la conformité d'un prix</h3>
        <p className="text-xs text-gray-400 mb-4">Saisissez votre prix et obtenez immédiatement un indicateur vert / orange / rouge.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Produit</label>
            <select
              value={checkProduct}
              onChange={e => { setCheckProduct(e.target.value); setCheckResult(null) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Choisir --</option>
              {prices.map(p => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prix pratiqué (FCFA)</label>
            <input
              type="number" min="1"
              value={checkPrice}
              onChange={e => { setCheckPrice(e.target.value); setCheckResult(null) }}
              placeholder="Ex : 520"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={verifyConformity}
              disabled={!checkProduct || !checkPrice}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Vérifier
            </button>
          </div>
        </div>

        {checkResult && (
          <div className={`mt-4 rounded-lg p-4 flex items-center gap-4 border ${
            checkResult.color === 'green'  ? 'bg-green-50 border-green-200' :
            checkResult.color === 'orange' ? 'bg-orange-50 border-orange-200' :
            checkResult.color === 'red'    ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <span className="text-3xl">
              {checkResult.color === 'green' ? '✅' : checkResult.color === 'orange' ? '⚠️' : checkResult.color === 'red' ? '🚨' : '❓'}
            </span>
            <div>
              <p className={`font-bold text-lg ${
                checkResult.color === 'green' ? 'text-green-700' : checkResult.color === 'orange' ? 'text-orange-700' : checkResult.color === 'red' ? 'text-red-700' : 'text-gray-700'
              }`}>
                {checkResult.status === 'CONFORME'   ? 'Prix conforme' :
                 checkResult.status === 'VIGILANCE'  ? 'Vigilance — dépassement léger' :
                 checkResult.status === 'INFRACTION' ? 'Infraction — prix illégal' : 'Produit inconnu'}
              </p>
              {checkResult.official && (
                <p className="text-sm text-gray-600">
                  Prix officiel : <strong>{Math.round(checkResult.official)} FCFA</strong>
                  {checkResult.ecart !== undefined && (
                    <span className="ml-2 font-semibold">
                      · Écart : {checkResult.ecart > 0 ? '+' : ''}{checkResult.ecart.toFixed(1)}%
                    </span>
                  )}
                </p>
              )}
              {checkResult.status === 'INFRACTION' && (
                <p className="text-xs text-red-600 mt-1">⚖️ Un dépassement de plus de 10% est passible de sanction. Ajustez votre prix.</p>
              )}
              {checkResult.msg && <p className="text-sm text-gray-500">{checkResult.msg}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Notice légale */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3">
        <span className="text-amber-500 text-xl">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Obligations légales du commerçant</p>
          <p className="text-xs text-amber-700">
            Conformément au décret sénégalais sur les prix réglementés, tout commerçant est tenu d'afficher et d'appliquer
            les prix officiels fixés par la DCI. Tout dépassement est passible de sanctions (amende, saisie de marchandises,
            fermeture temporaire). Les consommateurs peuvent signaler toute anomalie via la plateforme SénPrix.
          </p>
        </div>
      </div>

      {/* Filtre région */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">📍 Région :</label>
        <select value={region} onChange={e => setRegion(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
          {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-2">{prices.length} produit(s) réglementé(s)</span>
      </div>

      {/* Tableau par catégorie */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
          <p className="text-gray-400">Aucun prix officiel disponible pour cette région.</p>
        </div>
      ) : categories.map(cat => {
        const catPrices = prices.filter(p => p.category === cat)
        return (
          <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
            <div className="px-5 py-3 bg-green-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-green-600 font-bold text-sm uppercase tracking-wider">{cat}</span>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{catPrices.length} produits</span>
            </div>
            <div className="p-3">
              <ResponsiveTable columns={priceColumns} data={catPrices} />
            </div>
          </div>
        )
      })}

      {/* Footer légal */}
      <div className="mt-6 text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
        Prix fixés par la Direction du Commerce Intérieur (DCI) du Sénégal · Mis à jour en temps réel ·
        Tout dépassement doit être signalé au <strong>+221 33 889 00 00</strong>
      </div>
    </div>
  )
}
