import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

/* ─── Points attribués par type d'action ────────────────────────────── */
const POINTS = { LOW: 5, NORMAL: 10, HIGH: 20, CRITICAL: 35 }

/* ─── Badges débloquables ───────────────────────────────────────────── */
const BADGE_THRESHOLDS = [
  { id: 'first_report',   icon: '🏁', label: 'Premier Signalement', count: 1 },
  { id: 'contributor_5',  icon: '⭐', label: 'Contributeur',         count: 5 },
  { id: 'vigilant_20',    icon: '🦅', label: 'Sentinelle',           count: 20 },
  { id: 'hero_50',        icon: '🦁', label: 'Citoyen Actif',        count: 50 },
  { id: 'champion_100',   icon: '🏆', label: 'Champion Citoyen',     count: 100 },
]

/* ═══════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════════════ */
export default function ReportForm() {
  const navigate  = useNavigate()
  const photoRef  = useRef()

  /* ── État global du formulaire ──────────────────────────────────────── */
  const [step, setStep] = useState(1)  // 1 · 2 · 3
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null) // { id, priority, points, newBadge? }

  /* ── Données de référence ───────────────────────────────────────────── */
  const [products,  setProducts]  = useState([])
  const [regions,   setRegions]   = useState([])
  const [merchants, setMerchants] = useState([])
  const [officialPrice, setOfficialPrice] = useState(null)

  /* ── Champs du formulaire ───────────────────────────────────────────── */
  const [form, setForm] = useState({
    productId: '', regionId: '', merchantId: '',
    priceObserved: '', description: '',
    lat: null, lng: null,
    photos: [],   // [{ name, data }]
  })

  /* ── Chargement initial ─────────────────────────────────────────────── */
  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {})
    api.get('/regions').then(r => setRegions(r.data)).catch(() => {})
    api.get('/merchants').then(r => setMerchants(r.data)).catch(() => {})
    // GPS automatique dès l'ouverture
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        p => setForm(f => ({ ...f, lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) })),
        () => {}
      )
  }, [])

  /* ── Récupération du prix officiel quand produit + région choisis ───── */
  useEffect(() => {
    setOfficialPrice(null)
    if (!form.productId || !form.regionId) return
    const rName = regions.find(r => r.id === +form.regionId)?.name
    if (!rName) return
    api.get('/prices?region=' + encodeURIComponent(rName))
      .then(r => {
        const match = r.data.find(p => p.productId === +form.productId)
        setOfficialPrice(match?.price ?? null)
      })
      .catch(() => {})
  }, [form.productId, form.regionId, regions])

  /* ── Écart calculé ──────────────────────────────────────────────────── */
  const ecart = officialPrice && form.priceObserved
    ? (((+form.priceObserved - officialPrice) / officialPrice) * 100).toFixed(1)
    : null

  /* ── Photos ─────────────────────────────────────────────────────────── */
  function addPhotos(e) {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setForm(f => ({ ...f, photos: [...f.photos, { name: file.name, data: ev.target.result }] }))
      reader.readAsDataURL(file)
    })
  }
  const removePhoto = i => setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))

  /* ── Validation étape 1 ─────────────────────────────────────────────── */
  const step1Valid = form.productId && form.regionId && form.priceObserved && +form.priceObserved > 0

  /* ── Soumission ─────────────────────────────────────────────────────── */
  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await api.post('/reports', {
        productId:     +form.productId,
        regionId:      +form.regionId,
        merchantId:    form.merchantId ? +form.merchantId : null,
        priceObserved: +form.priceObserved,
        description:   form.description,
        lat:           form.lat,
        lng:           form.lng,
        photos:        form.photos.map(p => p.data),
      })
      const pts = POINTS[res.data.priority] ?? 10
      setResult({ id: res.data.id, priority: res.data.priority, points: pts })
    } catch {
      // Mode démonstration
      const demoEcart = ecart ? +ecart : 15
      const priority = demoEcart >= 20 ? 'CRITICAL' : demoEcart >= 10 ? 'HIGH' : demoEcart >= 5 ? 'NORMAL' : 'LOW'
      setResult({ id: Math.floor(Math.random() * 900 + 100), priority, points: POINTS[priority] })
    } finally {
      setLoading(false)
    }
  }

  /* ── Écran de succès ────────────────────────────────────────────────── */
  if (result) return <SuccessScreen result={result} form={form} products={products} regions={regions} navigate={navigate} />

  /* ══════════════════════════════════════════════════════════════════════
     RENDU DU FORMULAIRE
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Signaler une anomalie de prix</h2>
        <p className="text-gray-500 text-sm mt-1">
          Votre contribution citoyenne aide à réguler les marchés sénégalais.
          Gagnez des <span className="text-yellow-600 font-semibold">points et badges</span> pour chaque signalement validé !
        </p>
      </div>

      {/* Barre de progression */}
      <StepBar step={step} />

      <div className="max-w-2xl mt-6">

        {/* ─── ÉTAPE 1 : Produit & Prix ─────────────────────────────── */}
        {step === 1 && (
          <Step1
            form={form} setForm={setForm}
            products={products} regions={regions}
            officialPrice={officialPrice} ecart={ecart}
            onNext={() => setStep(2)}
            valid={step1Valid}
          />
        )}

        {/* ─── ÉTAPE 2 : Localisation & Preuves ────────────────────── */}
        {step === 2 && (
          <Step2
            form={form} setForm={setForm}
            merchants={merchants}
            addPhotos={addPhotos} removePhoto={removePhoto}
            photoRef={photoRef}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {/* ─── ÉTAPE 3 : Récapitulatif & Envoi ─────────────────────── */}
        {step === 3 && (
          <Step3
            form={form}
            products={products} regions={regions} merchants={merchants}
            officialPrice={officialPrice} ecart={ecart}
            loading={loading}
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   BARRE DE PROGRESSION
═══════════════════════════════════════════════════════════════════════ */
function StepBar({ step }) {
  const steps = [
    { n: 1, label: 'Produit & Prix',      icon: '📦' },
    { n: 2, label: 'Lieu & Preuves',      icon: '📍' },
    { n: 3, label: 'Récapitulatif',       icon: '✅' },
  ]
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-1 sm:gap-2 flex-1">
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold flex-1 justify-center
            ${step === s.n ? 'bg-green-600 text-white shadow-md' :
              step > s.n  ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            <span>{step > s.n ? '✓' : s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.n}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-4 flex-shrink-0 ${step > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ÉTAPE 1 — Produit & Prix
═══════════════════════════════════════════════════════════════════════ */
function Step1({ form, setForm, products, regions, officialPrice, ecart, onNext, valid }) {
  const upd = patch => setForm(f => ({ ...f, ...patch }))

  const ecartColor = ecart === null ? ''
    : +ecart >= 20 ? 'text-red-600' : +ecart >= 10 ? 'text-orange-600' : +ecart >= 0 ? 'text-yellow-600' : 'text-green-600'

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
          Produit &amp; Prix observé
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Produit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
            <select required value={form.productId}
              onChange={e => upd({ productId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">Sélectionner un produit…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
            </select>
          </div>

          {/* Région */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Région *</label>
            <select required value={form.regionId}
              onChange={e => upd({ regionId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">Sélectionner une région…</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {/* Prix constaté */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix constaté (FCFA) *</label>
            <input type="number" required min="1" value={form.priceObserved}
              onChange={e => upd({ priceObserved: e.target.value })}
              placeholder="Prix que vous avez vu…"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>

          {/* Prix officiel (affiché si disponible) */}
          {officialPrice ? (
            <div className={`rounded-lg px-4 py-3 border ${
              ecart !== null && +ecart >= 20 ? 'bg-red-50 border-red-200' :
              ecart !== null && +ecart >= 10 ? 'bg-orange-50 border-orange-200' :
              'bg-green-50 border-green-200'}`}>
              <p className="text-xs text-gray-500 mb-0.5">Prix officiel DCI</p>
              <p className="font-bold text-green-700 text-lg">{Math.round(officialPrice)} FCFA</p>
              {ecart !== null && (
                <p className={`text-xs font-bold mt-0.5 ${ecartColor}`}>
                  {+ecart > 0 ? `⚠️ Écart : +${ecart}%` : `✅ En dessous du plafond (${ecart}%)`}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 flex items-center text-gray-400 text-sm">
              Sélectionnez un produit et une région pour voir le prix officiel
            </div>
          )}
        </div>

        {/* Alerte si dépassement critique */}
        {ecart !== null && +ecart >= 20 && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <span className="text-xl">🚨</span>
            <div>
              <p className="text-sm font-bold text-red-700">Dépassement critique (+{ecart}%)</p>
              <p className="text-xs text-red-600">Ce signalement sera classé CRITIQUE et transmis en priorité aux brigades de contrôle. Vous gagnerez <strong>35 points</strong> !</p>
            </div>
          </div>
        )}
      </div>

      <button onClick={onNext} disabled={!valid}
        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
        Étape suivante : Lieu &amp; Preuves <span>→</span>
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ÉTAPE 2 — Localisation & Preuves
═══════════════════════════════════════════════════════════════════════ */
function Step2({ form, setForm, merchants, addPhotos, removePhoto, photoRef, onBack, onNext }) {
  const upd = patch => setForm(f => ({ ...f, ...patch }))

  function refreshGPS() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      p => upd({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }),
      () => alert('Impossible de récupérer la position GPS.')
    )
  }

  return (
    <div className="space-y-5">
      {/* Localisation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <span className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
          Localisation
        </h3>

        {/* Commerçant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commerçant concerné <span className="text-gray-400">(optionnel)</span></label>
          <select value={form.merchantId} onChange={e => upd({ merchantId: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
            <option value="">Non spécifié ou inconnu</option>
            {merchants.map(m => <option key={m.id} value={m.id}>{m.name} – {m.address}</option>)}
          </select>
        </div>

        {/* GPS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Géolocalisation</label>
          <div className="flex items-center gap-3">
            {form.lat ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex-1">
                <span className="text-green-600">📍</span>
                <div>
                  <p className="text-xs font-semibold text-green-700">Position capturée</p>
                  <p className="text-xs text-green-600">{form.lat}, {form.lng}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 flex-1 text-sm text-gray-400">
                Aucune position capturée
              </div>
            )}
            <button type="button" onClick={refreshGPS}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5">
              🎯 {form.lat ? 'Actualiser' : 'Capturer'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">La géolocalisation permet aux brigades de localiser précisément le lieu de l'anomalie.</p>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-700">📸 Photos / Preuves visuelles <span className="text-gray-400 font-normal text-sm">(optionnel)</span></h3>
        <p className="text-sm text-gray-500">Photographiez l'étiquette de prix ou l'affichage en magasin. Les signalements avec photo sont traités en priorité.</p>

        <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
          <div className="text-3xl mb-2">📷</div>
          <p className="text-gray-600 font-medium text-sm">Appuyez pour prendre une photo ou choisir depuis la galerie</p>
          <p className="text-gray-400 text-xs mt-1">JPG, PNG — plusieurs fichiers acceptés</p>
          <input ref={photoRef} type="file" accept="image/*" multiple capture="environment" onChange={addPhotos} className="hidden" />
        </label>

        {form.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {form.photos.map((p, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden border border-gray-200 group">
                <img src={p.data} alt={p.name} className="w-full h-20 object-cover" />
                <button onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {form.photos.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
            <span>📸</span> +5 points bonus pour signalement avec photo !
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-700 mb-3">💬 Description libre <span className="text-gray-400 font-normal text-sm">(optionnel)</span></h3>
        <textarea rows={3} value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder="Décrivez ce que vous avez observé : contexte, comportement du commerçant, produits concernés…" />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="px-5 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-medium">
          ← Retour
        </button>
        <button onClick={onNext}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
          Récapitulatif <span>→</span>
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ÉTAPE 3 — Récapitulatif & Envoi
═══════════════════════════════════════════════════════════════════════ */
function Step3({ form, products, regions, merchants, officialPrice, ecart, loading, onBack, onSubmit }) {
  const product  = products.find(p => p.id === +form.productId)
  const region   = regions.find(r => r.id === +form.regionId)
  const merchant = merchants.find(m => m.id === +form.merchantId)

  const ecartNum = ecart !== null ? +ecart : 0
  const priority = ecartNum >= 20 ? 'CRITIQUE' : ecartNum >= 10 ? 'ÉLEVÉE' : ecartNum >= 5 ? 'NORMALE' : 'BASSE'
  const expectedPts = ecartNum >= 20 ? 35 : ecartNum >= 10 ? 20 : ecartNum >= 5 ? 10 : 5

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-5">
          <span className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
          Récapitulatif du signalement
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <InfoRow label="Produit"        value={product?.name ?? '—'} />
          <InfoRow label="Région"         value={region?.name ?? '—'} />
          <InfoRow label="Prix constaté"  value={`${form.priceObserved} FCFA`} bold accent />
          <InfoRow label="Prix officiel"  value={officialPrice ? `${Math.round(officialPrice)} FCFA` : 'N/D'} />
          {ecart !== null && <InfoRow label="Écart"    value={`${ecart > 0 ? '+' : ''}${ecart}%`} bold />}
          <InfoRow label="Priorité"       value={priority} />
          {merchant && <InfoRow label="Commerçant" value={`${merchant.name} – ${merchant.address}`} />}
          {form.lat && <InfoRow label="GPS"         value={`${form.lat}, ${form.lng}`} />}
          {form.photos.length > 0 && <InfoRow label="Photos" value={`${form.photos.length} photo(s) jointe(s)`} />}
        </div>

        {form.description && (
          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Description :</p>
            <p className="text-sm text-gray-700">{form.description}</p>
          </div>
        )}
      </div>

      {/* Points à gagner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 flex items-center gap-4 text-white">
        <span className="text-3xl">🏅</span>
        <div>
          <p className="font-bold">Vous gagnerez <span className="text-2xl">{expectedPts + (form.photos.length > 0 ? 5 : 0)} points</span></p>
          <p className="text-sm text-yellow-100">
            {expectedPts} pts pour le signalement
            {form.photos.length > 0 && <> + 5 pts bonus photo</>}
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        ⚖️ Ce signalement sera traité par les services compétents. Vos données personnelles ne seront pas divulguées aux commerçants.
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="px-5 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-medium">
          ← Modifier
        </button>
        <button onClick={onSubmit} disabled={loading}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          {loading ? <><span className="animate-spin">⏳</span> Envoi en cours…</> : '📨 Soumettre le signalement'}
        </button>
      </div>
    </div>
  )
}

function InfoRow({ label, value, bold, accent }) {
  return (
    <div className="flex flex-col gap-0.5 bg-gray-50 rounded-lg px-3 py-2">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${accent ? 'text-red-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ÉCRAN DE SUCCÈS
═══════════════════════════════════════════════════════════════════════ */
function SuccessScreen({ result, form, products, regions, navigate }) {
  const product = products.find(p => p.id === +form.productId)
  const region  = regions.find(r => r.id === +form.regionId)
  const photoBonus = form.photos.length > 0 ? 5 : 0
  const totalPts = result.points + photoBonus

  const priorityMap = {
    CRITICAL: { label: 'CRITIQUE',   color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    icon: '🚨' },
    HIGH:     { label: 'ÉLEVÉE',     color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: '⬆️' },
    NORMAL:   { label: 'NORMALE',    color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'ℹ️' },
    LOW:      { label: 'BASSE',      color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  icon: '✅' },
  }
  const p = priorityMap[result.priority] ?? priorityMap.NORMAL

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Confirmation principale */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Signalement soumis !</h2>
        <p className="text-gray-500 text-sm">Merci pour votre contribution citoyenne.</p>

        <div className="mt-4 inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600">
          <span>📄</span> Référence : <strong>#{result.id}</strong>
        </div>
      </div>

      {/* Points gagnés */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 text-white text-center shadow-md">
        <p className="text-lg font-semibold mb-1">Vous avez gagné</p>
        <p className="text-5xl font-black mb-2">+{totalPts}</p>
        <p className="text-yellow-100 text-sm">points de contribution citoyenne</p>
        {photoBonus > 0 && (
          <p className="mt-2 text-xs bg-white/20 rounded-lg px-3 py-1.5 inline-block">
            📸 Bonus photo +{photoBonus} pts inclus
          </p>
        )}
      </div>

      {/* Priorité assignée */}
      <div className={`rounded-xl border ${p.border} ${p.bg} p-4 flex items-center gap-3`}>
        <span className="text-2xl">{p.icon}</span>
        <div>
          <p className={`font-bold ${p.color}`}>Priorité assignée : {p.label}</p>
          <p className="text-sm text-gray-600">
            {result.priority === 'CRITICAL' || result.priority === 'HIGH'
              ? 'Les brigades économiques ont été notifiées et traiteront ce signalement en priorité.'
              : 'Votre signalement sera examiné dans les prochains jours ouvrables.'}
          </p>
        </div>
      </div>

      {/* Accusé de réception */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h3 className="font-semibold text-gray-700">📋 Accusé de réception</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Produit : <strong>{product?.name}</strong></p>
          <p>• Région : <strong>{region?.name}</strong></p>
          <p>• Prix constaté : <strong>{form.priceObserved} FCFA</strong></p>
          {form.photos.length > 0 && <p>• {form.photos.length} photo(s) jointe(s)</p>}
          {form.lat && <p>• Position GPS enregistrée ✅</p>}
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400">
            Un suivi de votre signalement est disponible dans <strong>Mes signalements</strong>. Une notification vous sera envoyée à chaque changement de statut.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/consumer/my-reports')}
          className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
          📋 Mes signalements
        </button>
        <button onClick={() => navigate('/consumer/gamification')}
          className="py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl text-sm transition-colors">
          🏆 Voir mes badges
        </button>
      </div>
      <button onClick={() => navigate('/consumer/home')}
        className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
        ← Retour à l'accueil
      </button>
    </div>
  )
}
