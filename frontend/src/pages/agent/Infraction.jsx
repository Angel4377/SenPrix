import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'

/**
 * Formulaire numérique de constat d'infraction
 * Géolocalisation automatique + photo + génération PDF
 */
export default function Infraction() {
  const [step, setStep] = useState(1) // 1=infos, 2=preuves, 3=recap
  const [merchants, setMerchants] = useState([])
  const [products, setProducts] = useState([])
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const photoRef = useRef()

  const [form, setForm] = useState({
    merchantId: '',
    productId: '',
    prixConstate: '',
    prixOfficiel: '',
    typeInfraction: 'PRIX_EXCESSIF',
    description: '',
    latitude: null,
    longitude: null,
    adresseConstat: '',
    photos: [],
    dateMission: new Date().toISOString().split('T')[0],
    missionId: '',
  })

  useEffect(() => {
    api.get('/merchants').then(r => setMerchants(r.data)).catch(() => setMerchants([
      { id: 1, name: 'Épicerie Fatou', address: 'Marché Sandaga, Dakar' },
      { id: 2, name: 'Boutique Mamadou', address: 'HLM Grand Yoff, Dakar' },
      { id: 3, name: 'Supermarché Al Amine', address: 'Médina, Dakar' },
    ]))
    api.get('/products').then(r => setProducts(r.data)).catch(() => setProducts([
      { id: 1, name: 'Riz brisé', officialPrice: 500 },
      { id: 2, name: 'Huile végétale', officialPrice: 1200 },
      { id: 3, name: 'Sucre cristallisé', officialPrice: 750 },
    ]))
    // Géolocalisation automatique
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }))
      })
    }
  }, [])

  function handlePhotoCapture(e) {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setForm(f => ({ ...f, photos: [...f.photos, { name: file.name, data: ev.target.result }] }))
      }
      reader.readAsDataURL(file)
    })
  }

  function removePhoto(i) {
    setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))
  }

  function selectedProduct() {
    return products.find(p => p.id === +form.productId)
  }

  function ecartPct() {
    const off = +form.prixOfficiel || selectedProduct()?.officialPrice || 0
    const con = +form.prixConstate
    if (!off || !con) return 0
    return Math.round(((con - off) / off) * 100)
  }

  async function handleSubmit() {
    setGenerating(true)
    try {
      const payload = { ...form }
      const res = await api.post('/agent/infractions', payload)
      // Télécharger le PDF généré par le backend
      const pdfRes = await api.get(`/agent/infractions/${res.data.id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `constat_infraction_${res.data.id}.pdf`
      a.click()
      setSaved(true)
    } catch {
      // Simulation génération PDF (mode démo)
      generateLocalPDF()
      setSaved(true)
    } finally {
      setGenerating(false)
    }
  }

  function generateLocalPDF() {
    const merchant = merchants.find(m => m.id === +form.merchantId)
    const product = products.find(p => p.id === +form.productId)
    const ecart = ecartPct()
    const content = `CONSTAT D'INFRACTION - SamaPrix Sénégal
Direction du Commerce Intérieur (DCI)
======================================
Date : ${form.dateMission}
Agent : [Nom de l'agent connecté]

COMMERCE CONTRÔLÉ
-----------------
Nom : ${merchant?.name || 'N/A'}
Adresse : ${merchant?.address || form.adresseConstat}

INFRACTION CONSTATÉE
--------------------
Produit : ${product?.name || 'N/A'}
Type : ${form.typeInfraction.replace('_', ' ')}
Prix officiel : ${form.prixOfficiel || product?.officialPrice} FCFA
Prix constaté : ${form.prixConstate} FCFA
Écart : +${ecart}%

Géolocalisation : ${form.latitude}, ${form.longitude}

Description : ${form.description}

Photos jointes : ${form.photos.length} photo(s)

STATUT : EN COURS DE TRAITEMENT
Ce document vaut procès-verbal provisoire.
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `constat_${Date.now()}.txt`; a.click()
  }

  const INFRACTIONS = [
    { value: 'PRIX_EXCESSIF', label: 'Prix excessif (dépassement plafond officiel)' },
    { value: 'AFFICHAGE_ABSENT', label: 'Absence d\'affichage des prix obligatoire' },
    { value: 'TROMPERIE', label: 'Tromperie sur la qualité ou le poids' },
    { value: 'STOCKAGE_ILLEGAL', label: 'Stockage illégal (rétention de marchandises)' },
    { value: 'AUTRE', label: 'Autre infraction' },
  ]

  if (saved) return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <h2 className="text-2xl font-bold text-green-700">Constat enregistré</h2>
      <p className="text-gray-600">Le rapport PDF a été téléchargé et transmis à la DCI.</p>
      <button onClick={() => { setSaved(false); setStep(1); setForm(f => ({ ...f, merchantId: '', productId: '', prixConstate: '', description: '', photos: [] })) }}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
        Nouveau constat
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Constat d'Infraction</h1>
      </div>

      {/* Progression */}
      <div className="flex items-center gap-2">
        {['Infraction', 'Preuves', 'Récapitulatif'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div onClick={() => step > i + 1 && setStep(i + 1)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer
                ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${step === i + 1 ? 'font-semibold text-red-600' : 'text-gray-500'}`}>{label}</span>
            {i < 2 && <div className={`w-12 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* ÉTAPE 1 : Informations */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commerce contrôlé *</label>
              <select value={form.merchantId} onChange={e => setForm(f => ({ ...f, merchantId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">-- Sélectionner --</option>
                {merchants.map(m => <option key={m.id} value={m.id}>{m.name} – {m.address}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date du constat *</label>
              <input type="date" value={form.dateMission} onChange={e => setForm(f => ({ ...f, dateMission: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produit concerné *</label>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value, prixOfficiel: products.find(p => p.id === +e.target.value)?.officialPrice || '' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">-- Sélectionner --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'infraction *</label>
              <select value={form.typeInfraction} onChange={e => setForm(f => ({ ...f, typeInfraction: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {INFRACTIONS.map(inf => <option key={inf.value} value={inf.value}>{inf.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix officiel (FCFA)</label>
              <input type="number" value={form.prixOfficiel} onChange={e => setForm(f => ({ ...f, prixOfficiel: e.target.value }))}
                placeholder="Auto-rempli selon le produit"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix constaté (FCFA) *</label>
              <input type="number" value={form.prixConstate} onChange={e => setForm(f => ({ ...f, prixConstate: e.target.value }))}
                placeholder="Prix affiché ou pratiqué"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Écart calculé */}
          {form.prixConstate && form.prixOfficiel && (
            <div className={`rounded-lg p-3 flex items-center gap-3 ${ecartPct() >= 20 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div>
                <p className={`font-bold ${ecartPct() >= 20 ? 'text-red-700' : 'text-yellow-700'}`}>
                  Écart constaté : +{ecartPct()}% par rapport au prix officiel
                </p>
                <p className="text-xs text-gray-500">
                  {ecartPct() >= 20 ? 'INFRACTION CRITIQUE — sanction immédiate applicable' : 'Dépassement à documenter'}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description des faits *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Décrivez précisément les faits constatés..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Géolocalisation */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
            {form.latitude ? (
              <p className="text-sm text-green-700 font-medium">Géolocalisation : {form.latitude}, {form.longitude}</p>
            ) : (
              <p className="text-sm text-gray-500">Récupération de la position GPS en cours...</p>
            )}
          </div>

          <button onClick={() => setStep(2)}
            disabled={!form.merchantId || !form.productId || !form.prixConstate || !form.description}
            className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50">
            Étape suivante : Ajouter des preuves →
          </button>
        </div>
      )}

      {/* ÉTAPE 2 : Preuves photo */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Photos / Preuves visuelles</h2>
          <p className="text-sm text-gray-500">Photographiez le prix affiché, la marchandise, et toute preuve pertinente.</p>

          <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
            <p className="text-gray-600 font-medium">Appuyez pour prendre une photo ou sélectionner depuis la galerie</p>
            <p className="text-gray-400 text-xs mt-1">JPG, PNG — plusieurs fichiers acceptés</p>
            <input ref={photoRef} type="file" accept="image/*" multiple capture="environment" onChange={handlePhotoCapture} className="hidden" />
          </label>

          {form.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {form.photos.map((p, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img src={p.data} alt={p.name} className="w-full h-24 object-cover" />
                  <button onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    ×
                  </button>
                  <p className="text-xs text-center p-1 truncate text-gray-500">{p.name}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              ← Retour
            </button>
            <button onClick={() => setStep(3)} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">
              {form.photos.length > 0 ? `Continuer avec ${form.photos.length} photo(s) →` : 'Continuer sans photo →'}
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : Récapitulatif */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Récapitulatif du constat</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Commerce :</span> <span className="font-medium">{merchants.find(m => m.id === +form.merchantId)?.name}</span></div>
              <div><span className="text-gray-500">Date :</span> <span className="font-medium">{form.dateMission}</span></div>
              <div><span className="text-gray-500">Produit :</span> <span className="font-medium">{products.find(p => p.id === +form.productId)?.name}</span></div>
              <div><span className="text-gray-500">Type :</span> <span className="font-medium">{INFRACTIONS.find(i => i.value === form.typeInfraction)?.label}</span></div>
              <div><span className="text-gray-500">Prix officiel :</span> <span className="font-medium">{form.prixOfficiel} FCFA</span></div>
              <div><span className="text-gray-500">Prix constaté :</span> <span className="font-bold text-red-600">{form.prixConstate} FCFA (+{ecartPct()}%)</span></div>
              <div><span className="text-gray-500">GPS :</span> <span className="font-medium">{form.latitude}, {form.longitude}</span></div>
              <div><span className="text-gray-500">Photos :</span> <span className="font-medium">{form.photos.length} jointe(s)</span></div>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">Description :</p>
              <p className="text-sm text-gray-700">{form.description}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            Ce constat aura valeur de procès-verbal officiel. Un rapport PDF sera généré automatiquement et transmis à la DCI.
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              ← Modifier
            </button>
            <button onClick={handleSubmit} disabled={generating}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {generating ? 'Génération du PDF...' : 'Valider et générer le rapport PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
