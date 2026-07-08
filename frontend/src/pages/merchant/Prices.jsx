import { useEffect, useState } from 'react'
import api from '../../api/axios'

const MOTIFS = [
  'Hausse du prix fournisseur',
  'Rupture d\'approvisionnement régional',
  'Frais de transport exceptionnels',
  'Coût de stockage / conservation',
  'Autre raison',
]

export default function MerchantPrices() {
  const [shop, setShop] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)

  // Édition inline d'un prix déclaré
  const [editingId, setEditingId] = useState(null)
  const [editPrice, setEditPrice] = useState('')

  // Formulaire "Justifier un écart"
  const [justifyProductId, setJustifyProductId] = useState('')
  const [motif, setMotif] = useState('')
  const [commentaire, setCommentaire] = useState('')

  const loadAll = () => {
    api.get('/merchant/shop').then(r => setShop(r.data))
    api.get('/merchant/prices').then(r => { setRows(r.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [])

  const nonConformes = rows.filter(r => r.conformity === 'NON_CONFORME')
  const alertRow = nonConformes.find(r => !r.justifiedAt)

  const startEdit = row => {
    setEditingId(row.productId)
    setEditPrice(row.declaredPrice ?? row.officialPrice ?? '')
  }

  const saveEdit = async productId => {
    try {
      await api.put('/merchant/prices', { productId, price: +editPrice })
      setMsg('Prix déclaré mis à jour.')
      setMsgOk(true)
      setEditingId(null)
      loadAll()
    } catch { setMsg('Erreur lors de la mise à jour du prix.'); setMsgOk(false) }
  }

  const submitJustification = async e => {
    e.preventDefault()
    const row = rows.find(r => r.productId === +justifyProductId)
    if (!row?.declaredPriceId || !motif) return
    try {
      await api.post(`/merchant/prices/${row.declaredPriceId}/justify`, { motif, commentaire })
      setMsg('Justification transmise à la DCI.')
      setMsgOk(true)
      setJustifyProductId(''); setMotif(''); setCommentaire('')
      loadAll()
    } catch { setMsg('Erreur lors de l\'envoi de la justification.'); setMsgOk(false) }
  }

  const conformityBadge = c => {
    if (c === 'CONFORME') return <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Conforme</span>
    if (c === 'NON_CONFORME') return <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">Non conforme</span>
    return <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">Non déclaré</span>
  }

  if (loading) return <div className="p-10 text-center text-gray-400">Chargement…</div>

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Espace commerçant</h2>
        <p className="text-gray-500 text-sm">
          {shop?.name ? `${shop.name}${shop.address ? ' — ' + shop.address : ''}` : 'Déclarez vos prix et suivez votre conformité aux prix officiels DCI.'}
        </p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${msgOk ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </div>
      )}

      {/* Bannière d'alerte de conformité */}
      {alertRow && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Alerte de conformité : votre prix de {alertRow.productName.toLowerCase()} ({Math.round(alertRow.declaredPrice)} FCFA) dépasse
              le prix de référence de {alertRow.ecart}%.
            </p>
            <p className="text-xs text-amber-700 mt-1">Vous pouvez justifier cet écart dans le formulaire ci-dessous.</p>
          </div>
        </div>
      )}

      {/* Mes prix déclarés */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Mes prix déclarés</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Produit', 'Prix réf. (FCFA)', 'Prix déclaré', 'Conformité', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.productName}<span className="text-gray-400 text-xs ml-1">/ {r.unit}</span></td>
                  <td className="px-4 py-3 text-gray-600">{Math.round(r.officialPrice)}</td>
                  <td className="px-4 py-3">
                    {editingId === r.productId ? (
                      <input type="number" autoFocus value={editPrice} onChange={e => setEditPrice(e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm" />
                    ) : (
                      <span className="font-semibold text-gray-800">{r.declaredPrice != null ? Math.round(r.declaredPrice) : '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{conformityBadge(r.conformity)}</td>
                  <td className="px-4 py-3 text-right">
                    {editingId === r.productId ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => saveEdit(r.productId)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium">Enregistrer</button>
                        <button onClick={() => setEditingId(null)} className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg">Annuler</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(r)} className="text-xs border border-gray-300 hover:border-gray-400 text-gray-600 px-3 py-1.5 rounded-lg font-medium">Modifier</button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucun produit réglementé pour votre région.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Justifier un écart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-1">Justifier un écart</h3>
        <p className="text-xs text-gray-400 mb-4">Expliquez pourquoi votre prix dépasse le prix officiel. Votre justification sera transmise aux agents de contrôle.</p>

        {nonConformes.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun écart à justifier actuellement — tous vos prix déclarés sont conformes.</p>
        ) : (
          <form onSubmit={submitJustification} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Produit concerné *</label>
              <select required value={justifyProductId} onChange={e => setJustifyProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Sélectionner…</option>
                {nonConformes.map(r => (
                  <option key={r.productId} value={r.productId}>
                    {r.productName} — {Math.round(r.declaredPrice)} FCFA (+{r.ecart}%){r.justifiedAt ? ' · déjà justifié' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Motif *</label>
              <select required value={motif} onChange={e => setMotif(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Sélectionner un motif…</option>
                {MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Commentaire</label>
              <textarea rows={3} value={commentaire} onChange={e => setCommentaire(e.target.value)}
                placeholder="Précisez le contexte (ex : rupture d'approvisionnement depuis 10 jours)…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
            </div>
            <button type="submit" disabled={!justifyProductId || !motif}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-2.5 px-5 rounded-lg text-sm">
              Transmettre la justification
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
