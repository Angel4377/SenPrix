import { useEffect, useState } from 'react'
import api from '../../api/axios'

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const STATUS_META = {
  PENDING:  { label: 'En attente',      icon: '🕐', color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  VERIFIED: { label: 'Vérifié',         icon: '✅', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  RESOLVED: { label: 'Résolu',          icon: '🏁', color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200'  },
  REJECTED: { label: 'Rejeté',          icon: '❌', color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200'    },
}

const PRIORITY_META = {
  LOW:      { label: 'Basse',    color: 'text-gray-500',   dot: 'bg-gray-400'   },
  NORMAL:   { label: 'Normale',  color: 'text-blue-600',   dot: 'bg-blue-400'   },
  HIGH:     { label: 'Élevée',   color: 'text-orange-600', dot: 'bg-orange-400' },
  CRITICAL: { label: 'Critique', color: 'text-red-600',    dot: 'bg-red-500'    },
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════════════ */
export default function MyReports() {
  const [tab, setTab]         = useState('mine')   // 'mine' | 'community'
  const [myReports, setMyReports]           = useState([])
  const [communityReports, setCommunityReports] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('ALL')
  const [confirmingId, setConfirmingId] = useState(null)
  const [confirmedIds, setConfirmedIds] = useState(new Set())

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [mine, community] = await Promise.all([
        api.get('/reports/my').then(r => r.data),
        api.get('/reports/community').then(r => r.data).catch(() => []),
      ])
      setMyReports(mine)
      setCommunityReports(community)
    } catch {
      // Demo data
      setMyReports(DEMO_MY_REPORTS)
      setCommunityReports(DEMO_COMMUNITY)
    } finally {
      setLoading(false)
    }
  }

  async function confirmReport(id) {
    setConfirmingId(id)
    try {
      await api.post(`/reports/${id}/confirm`)
      setConfirmedIds(prev => new Set([...prev, id]))
      // Mise à jour locale du compteur
      setCommunityReports(prev => prev.map(r =>
        r.id === id ? { ...r, confirmationCount: (r.confirmationCount ?? 0) + 1 } : r
      ))
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Erreur lors de la confirmation.'
      alert(msg)
    } finally {
      setConfirmingId(null)
    }
  }

  /* Filtrage de mes signalements */
  const filtered = filter === 'ALL' ? myReports : myReports.filter(r => r.status === filter)

  /* Compteurs */
  const pending  = myReports.filter(r => r.status === 'PENDING').length
  const verified = myReports.filter(r => r.status === 'VERIFIED').length
  const resolved = myReports.filter(r => r.status === 'RESOLVED').length

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mes signalements</h2>
        <p className="text-gray-500 text-sm mt-1">Suivez vos signalements et aidez à valider ceux de la communauté.</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <TabBtn active={tab === 'mine'} onClick={() => setTab('mine')}>
          📋 Mes signalements
          {myReports.length > 0 && <span className="ml-1.5 bg-gray-200 text-gray-600 text-xs rounded-full px-1.5 py-0.5">{myReports.length}</span>}
        </TabBtn>
        <TabBtn active={tab === 'community'} onClick={() => setTab('community')}>
          🤝 Validation communautaire
          {communityReports.length > 0 && <span className="ml-1.5 bg-blue-100 text-blue-600 text-xs rounded-full px-1.5 py-0.5">{communityReports.length}</span>}
        </TabBtn>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-3 animate-pulse">⏳</div>
            <p className="text-sm">Chargement…</p>
          </div>
        </div>
      ) : tab === 'mine' ? (
        <MineTab
          reports={filtered} filter={filter} setFilter={setFilter}
          pending={pending} verified={verified} resolved={resolved}
          total={myReports.length}
        />
      ) : (
        <CommunityTab
          reports={communityReports}
          confirmedIds={confirmedIds}
          confirmingId={confirmingId}
          onConfirm={confirmReport}
        />
      )}
    </div>
  )
}

/* ─── TabBtn ─────────────────────────────────────────────────────────── */
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 flex items-center gap-1 transition-colors -mb-px
        ${active ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {children}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ONGLET : MES SIGNALEMENTS
═══════════════════════════════════════════════════════════════════════ */
function MineTab({ reports, filter, setFilter, pending, verified, resolved, total }) {
  const FILTERS = [
    { value: 'ALL',      label: 'Tous',         count: total    },
    { value: 'PENDING',  label: 'En attente',   count: pending  },
    { value: 'VERIFIED', label: 'Vérifiés',     count: verified },
    { value: 'RESOLVED', label: 'Résolus',      count: resolved },
  ]

  return (
    <div className="space-y-5">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="🕐" label="En attente" value={pending}  color="yellow" />
        <StatCard icon="✅" label="Vérifiés"   value={verified} color="blue"   />
        <StatCard icon="🏁" label="Résolus"    value={resolved} color="green"  />
      </div>

      {/* Filtre */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1
              ${filter === f.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label} <span className={`${filter === f.value ? 'bg-white/30' : 'bg-gray-200'} rounded-full px-1.5`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Liste */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">Aucun signalement</p>
          <p className="text-gray-400 text-sm mt-1">Vos futurs signalements apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => <ReportCard key={r.id} report={r} />)}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    blue:   'bg-blue-50 border-blue-100 text-blue-700',
    green:  'bg-green-50 border-green-100 text-green-700',
  }
  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-75">{label}</div>
    </div>
  )
}

function ReportCard({ report: r }) {
  const s = STATUS_META[r.status] ?? STATUS_META.PENDING
  const p = PRIORITY_META[r.priority] ?? PRIORITY_META.NORMAL
  const ecart = r.ecartPercent ?? (r.officialPrice ? (((r.priceObserved - r.officialPrice) / r.officialPrice) * 100).toFixed(1) : null)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      {/* En-tête de la carte */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">{r.productName}</span>
            <span className="text-xs text-gray-400">#{r.id}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{r.regionName}{r.merchantName ? ` · ${r.merchantName}` : ''}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.border} ${s.color}`}>
          {s.icon} {s.label}
        </span>
      </div>

      {/* Corps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400 mb-0.5">Prix constaté</p>
          <p className="font-bold text-gray-800 text-sm">{r.priceObserved?.toLocaleString('fr-FR')} FCFA</p>
        </div>
        {r.officialPrice && (
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-gray-400 mb-0.5">Prix officiel</p>
            <p className="font-bold text-gray-800 text-sm">{Math.round(r.officialPrice).toLocaleString('fr-FR')} FCFA</p>
          </div>
        )}
        {ecart !== null && (
          <div className={`rounded-lg px-3 py-2 ${+ecart >= 10 ? 'bg-red-50' : +ecart >= 5 ? 'bg-orange-50' : 'bg-green-50'}`}>
            <p className="text-gray-400 mb-0.5">Écart</p>
            <p className={`font-bold text-sm ${+ecart >= 10 ? 'text-red-600' : +ecart >= 5 ? 'text-orange-600' : 'text-green-700'}`}>
              {ecart > 0 ? '+' : ''}{ecart}%
            </p>
          </div>
        )}
      </div>

      {/* Priorité & Date */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${p.dot}`}></span>
          <span className={`text-xs font-medium ${p.color}`}>Priorité {p.label}</span>
        </div>
        <span className="text-xs text-gray-400">{fmtDate(r.createdAt)}</span>
      </div>

      {/* Timeline de statut */}
      <StatusTimeline status={r.status} />

      {r.description && (
        <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic">
          "{r.description}"
        </p>
      )}
    </div>
  )
}

function StatusTimeline({ status }) {
  const steps = [
    { key: 'PENDING',  icon: '📨', label: 'Soumis' },
    { key: 'VERIFIED', icon: '🔍', label: 'Vérifié' },
    { key: 'RESOLVED', icon: '🏁', label: 'Résolu' },
  ]
  const order = { PENDING: 0, VERIFIED: 1, RESOLVED: 2, REJECTED: 3 }
  const current = order[status] ?? 0

  if (status === 'REJECTED') {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
        <span>❌</span> Ce signalement a été rejeté par les équipes DCI.
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-center gap-1">
      {steps.map((s, i) => {
        const done = i <= current
        const active = i === current
        return (
          <div key={s.key} className="flex items-center flex-1">
            <div className={`flex flex-col items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${active ? 'bg-green-600 text-white shadow-sm' : done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {done ? (active ? s.icon : '✓') : i + 1}
              </div>
              <span className={`text-xs mt-0.5 ${active ? 'text-green-700 font-semibold' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-3 ${i < current ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ONGLET : VALIDATION COMMUNAUTAIRE
═══════════════════════════════════════════════════════════════════════ */
function CommunityTab({ reports, confirmedIds, confirmingId, onConfirm }) {
  return (
    <div className="space-y-5">
      {/* Explication */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <span className="text-2xl">🤝</span>
        <div>
          <p className="font-semibold text-blue-800 text-sm">Comment ça marche ?</p>
          <p className="text-xs text-blue-700 mt-1">
            Ces signalements ont été soumis par d'autres consommateurs. En les confirmant,
            vous aidez à valider les anomalies de prix. Après <strong>3 confirmations</strong>,
            un signalement est automatiquement marqué comme <em>Vérifié</em> et transmis aux brigades.
            Chaque confirmation vous rapporte <strong>+3 points</strong> !
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-gray-500 font-medium">Tous les signalements ont été validés !</p>
          <p className="text-gray-400 text-sm mt-1">Revenez plus tard pour de nouveaux signalements à confirmer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <CommunityCard key={r.id} report={r}
              confirmed={confirmedIds.has(r.id)}
              confirming={confirmingId === r.id}
              onConfirm={() => onConfirm(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CommunityCard({ report: r, confirmed, confirming, onConfirm }) {
  const count = r.confirmationCount ?? 0
  const pct   = Math.min((count / 3) * 100, 100)

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${confirmed ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-gray-800 text-sm">{r.productName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{r.regionName}{r.merchantName ? ` · ${r.merchantName}` : ''}</p>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{fmtDate(r.createdAt)}</span>
      </div>

      {/* Prix */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs">
          <p className="text-gray-400">Prix constaté</p>
          <p className="font-bold text-red-600 text-sm">{r.priceObserved?.toLocaleString('fr-FR')} FCFA</p>
        </div>
        {r.officialPrice && (
          <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs">
            <p className="text-gray-400">Prix officiel</p>
            <p className="font-bold text-green-700 text-sm">{Math.round(r.officialPrice).toLocaleString('fr-FR')} FCFA</p>
          </div>
        )}
        {r.ecartPercent != null && (
          <div className={`flex-1 rounded-lg px-3 py-2 text-xs ${+r.ecartPercent >= 10 ? 'bg-red-50' : 'bg-orange-50'}`}>
            <p className="text-gray-400">Écart</p>
            <p className={`font-bold text-sm ${+r.ecartPercent >= 10 ? 'text-red-600' : 'text-orange-600'}`}>
              +{r.ecartPercent}%
            </p>
          </div>
        )}
      </div>

      {r.description && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic mb-3">
          "{r.description}"
        </p>
      )}

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Confirmations communautaires</span>
          <span className={`font-bold ${count >= 3 ? 'text-green-600' : 'text-gray-600'}`}>{count}/3</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${count >= 3 ? 'bg-green-500' : 'bg-blue-400'}`}
               style={{ width: `${pct}%` }} />
        </div>
        {count >= 3 && (
          <p className="text-xs text-green-600 mt-1 font-medium">✅ Seuil atteint — signalement vérifié automatiquement !</p>
        )}
      </div>

      {/* Bouton de confirmation */}
      {confirmed ? (
        <div className="flex items-center gap-2 justify-center py-2 bg-green-100 rounded-lg text-green-700 text-sm font-medium">
          <span>✓</span> Vous avez confirmé ce signalement (+3 pts)
        </div>
      ) : (
        <button onClick={onConfirm} disabled={confirming || count >= 3}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
          {confirming ? <><span className="animate-spin">⏳</span> Confirmation…</> : '🤝 Confirmer ce signalement (+3 pts)'}
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   DONNÉES DE DÉMONSTRATION
═══════════════════════════════════════════════════════════════════════ */
const DEMO_MY_REPORTS = [
  {
    id: 101, productName: 'Riz brisé local', regionName: 'Dakar', merchantName: 'Marché Sandaga',
    priceObserved: 650, officialPrice: 500, ecartPercent: 30, status: 'VERIFIED', priority: 'CRITICAL',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    description: "Le sac de 25kg est vendu à 650 FCFA le kilo alors que le prix est de 500 FCFA."
  },
  {
    id: 99,  productName: 'Huile végétale', regionName: 'Thiès', merchantName: null,
    priceObserved: 1100, officialPrice: 1000, ecartPercent: 10, status: 'PENDING', priority: 'HIGH',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), description: null
  },
  {
    id: 87,  productName: 'Sucre blanc', regionName: 'Saint-Louis',
    priceObserved: 600, officialPrice: 560, ecartPercent: 7.1, status: 'RESOLVED', priority: 'NORMAL',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), description: null
  },
]

const DEMO_COMMUNITY = [
  {
    id: 200, productName: 'Tomates fraîches', regionName: 'Ziguinchor', merchantName: 'Marché central',
    priceObserved: 800, officialPrice: 600, ecartPercent: 33.3, confirmationCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), description: "Prix affiché en vitrine."
  },
  {
    id: 201, productName: 'Lait en poudre', regionName: 'Kaolack',
    priceObserved: 2200, officialPrice: 1900, ecartPercent: 15.8, confirmationCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), description: null
  },
  {
    id: 202, productName: 'Pain ordinaire', regionName: 'Dakar', merchantName: 'Boulangerie Almadies',
    priceObserved: 175, officialPrice: 150, ecartPercent: 16.7, confirmationCount: 0,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(), description: "Baguette vendue 175 FCFA au lieu de 150."
  },
]
