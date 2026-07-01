import { useEffect, useState } from "react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import api from "../../api/axios"

const COULEURS_PRIORITE = { CRITIQUE: "#FF4D6D", ELEVE: "#FF9F43", NORMAL: "#4A90E2", BAS: "#A3AED0" }

const DEMO_STATS = {
  totalReports: 284,
  pendingReports: 47,
  criticalReports: 12,
  resolvedReports: 198,
  totalMerchants: 134,
  totalProducts: 28,
  totalMissions: 9,
  totalInfractions: 23,
  byRegion: [
    { name: 'Dakar',       count: 112 },
    { name: 'Thiès',       count: 58 },
    { name: 'Saint-Louis', count: 34 },
    { name: 'Ziguinchor',  count: 27 },
    { name: 'Kaolack',     count: 31 },
    { name: 'Diourbel',    count: 22 },
  ],
  byPriority: [
    { priority: 'CRITICAL', count: 12 },
    { priority: 'HIGH',     count: 49 },
    { priority: 'NORMAL',   count: 143 },
    { priority: 'LOW',      count: 80 },
  ],
  recentReports: [
    { id:101, product:'Riz brisé',       region:'Dakar',       priceObserved:650, officialPrice:500, priority:'CRITICAL', status:'PENDING',  createdAt:'2026-06-22' },
    { id:102, product:'Huile végétale',  region:'Thiès',       priceObserved:1400,officialPrice:1200,priority:'HIGH',     status:'VERIFIED', createdAt:'2026-06-22' },
    { id:103, product:'Sucre cristallisé',region:'Saint-Louis',priceObserved:820, officialPrice:750, priority:'NORMAL',  status:'RESOLVED', createdAt:'2026-06-21' },
    { id:104, product:'Pain ordinaire',  region:'Kaolack',     priceObserved:250, officialPrice:225, priority:'NORMAL',  status:'PENDING',  createdAt:'2026-06-21' },
    { id:105, product:'Riz brisé',       region:'Ziguinchor',  priceObserved:700, officialPrice:500, priority:'CRITICAL', status:'PENDING', createdAt:'2026-06-20' },
  ],
}

export default function TableauDeBordAdmin() {
  const [donnees, setDonnees] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    api.get("/admin/dashboard/stats")
      .then(r => { setDonnees(r.data); setChargement(false) })
      .catch(() => { setDonnees(DEMO_STATS); setChargement(false) })
  }, [])

  if (chargement) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 40, height: 40, border: "3px solid var(--bordure)", borderTop: "3px solid var(--acc)", borderRadius: "50%", animation: "spin 1s linear infinite" }}/>
      <span style={{ color: "var(--gris)", fontSize: 13 }}>Chargement du tableau de bord...</span>
    </div>
  )

  if (!donnees) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: "var(--texte)", marginBottom: 6 }}>Erreur de chargement</h3>
        <p style={{ color: "var(--gris)", fontSize: 13 }}>Impossible de récupérer les statistiques.</p>
        <button onClick={() => window.location.reload()} className="btn-principal" style={{ marginTop: 16 }}>🔄 Réessayer</button>
      </div>
    </div>
  )

  const indicateurs = [
    { label: "Signalements critiques", valeur: donnees.criticalReports, abrev: "CR", couleur: "#FF4D6D", fondIcone: "#fff0f3", tendance: "▲ +3", tendanceOk: false },
    { label: "En attente", valeur: donnees.pendingReports, abrev: "AT", couleur: "#FF9F43", fondIcone: "#fff8ed", tendance: "▼ -5", tendanceOk: true },
    { label: "Résolus ce mois", valeur: donnees.resolvedReports, abrev: "OK", couleur: "#05D69E", fondIcone: "#e6fdf6", tendance: "▲ +12", tendanceOk: true },
    { label: "Total signalements", valeur: donnees.totalReports, abrev: "TO", couleur: "#4A90E2", fondIcone: "#eef4ff", tendance: `${donnees.byRegion?.length || 0} régions`, tendanceOk: true },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* EN-TÊTE */}
      <div style={{ background: "white", borderBottom: "1px solid var(--bordure)", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 8px rgba(27,37,89,.04)", flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--texte)", letterSpacing: "-.3px" }}>Tableau de bord</h2>
          <p style={{ fontSize: 10, color: "var(--gris)", marginTop: 1 }}>Direction du Commerce Intérieur · Surveillance des marchés · Sénégal</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn-secondaire">Exporter le rapport</button>
          <button className="btn-principal">Nouveau signalement</button>
        </div>
      </div>

      {/* CONTENU */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

        {/* INDICATEURS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          {indicateurs.map(ind => (
            <div key={ind.label} className="carte" style={{ padding: 18, transition: ".2s", cursor: "default" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: ind.fondIcone, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: ind.couleur }}>{ind.abrev}</div>
                <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, background: ind.tendanceOk ? "#e6fdf6" : "#fff0f3", color: ind.tendanceOk ? "var(--acc2)" : "var(--rouge)" }}>{ind.tendance}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: ind.couleur, letterSpacing: "-.5px" }}>{ind.valeur}</div>
              <div style={{ fontSize: 11, color: "var(--gris)", marginTop: 3 }}>{ind.label}</div>
              <div style={{ height: 3, background: "var(--bordure)", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "60%", background: ind.couleur, borderRadius: 2 }}/>
              </div>
            </div>
          ))}
        </div>

        {/* STATISTIQUES SECONDAIRES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          {[
            { valeur: donnees.totalMerchants,  label: "Commerçants" },
            { valeur: donnees.totalMissions,   label: "Missions actives" },
            { valeur: donnees.totalInfractions,label: "PV dressés" },
            { valeur: donnees.totalProducts,   label: "Produits surveillés" },
          ].map(s => (
            <div key={s.label} className="carte" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#05D69E", flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--texte)" }}>{s.valeur}</div>
                <div style={{ fontSize: 9, color: "var(--gris)" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* GRAPHIQUES */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
          <div className="carte" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--bordure)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Signalements par région</span>
              <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 9, fontWeight: 700, background: "rgba(5,214,158,.1)", color: "var(--acc2)" }}>Ce mois</span>
            </div>
            <div style={{ padding: 16 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={donnees.byRegion || []} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--gris)" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 10, fill: "var(--gris)" }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--bordure)", fontSize: 12 }} formatter={(v) => [`${v} signalements`, ""]}/>
                  <Bar dataKey="count" fill="url(#degradeVert)" radius={[5,5,0,0]} name="Signalements"/>
                  <defs>
                    <linearGradient id="degradeVert" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#05D69E"/>
                      <stop offset="100%" stopColor="#04b884"/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="carte" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--bordure)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Répartition par priorité</span>
              <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 9, fontWeight: 700, background: "rgba(5,214,158,.1)", color: "var(--acc2)" }}>Actif</span>
            </div>
            <div style={{ padding: 16 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donnees.byPriority || []} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                    {(donnees.byPriority || []).map(e => <Cell key={e.priority} fill={COULEURS_PRIORITE[e.priority] || "#ccc"}/>)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} signalements`, n]}/>
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10, color: "var(--texte)" }}>{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TABLEAU SIGNALEMENTS */}
        <div className="carte-dark" style={{ overflow: "hidden" }}>
          <div className="header-dark">
            <span className="title">Derniers signalements prioritaires</span>
            <a href="/admin/reports" className="link">Voir tout →</a>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="dashboard-table-dark">
              <thead>
                <tr>
                  {["N°","Produit","Commerçant","Région","Prix observé","Prix officiel","Écart","Priorité","Statut","Action"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(donnees.recentReports || []).map(r => {
                  const ecart = r.officialPrice > 0 ? ((r.priceObserved - r.officialPrice) / r.officialPrice * 100).toFixed(1) : null
                  const prioriteClasse = { CRITICAL: "etiquette-critique", HIGH: "etiquette-eleve", NORMAL: "etiquette-normal" }
                  const statutClasse = { PENDING: "etiquette-attente", VERIFIED: "etiquette-verifie", RESOLVED: "etiquette-resolu", REJECTED: "etiquette-rejete" }
                  const prioriteFr = { CRITICAL: "CRITIQUE", HIGH: "ÉLEVÉ", NORMAL: "NORMAL" }
                  const statutFr = { PENDING: "ATTENTE", VERIFIED: "VÉRIFIÉ", RESOLVED: "RÉSOLU", REJECTED: "REJETÉ" }
                  return (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td className="td-accent">{r.product}</td>
                      <td>—</td>
                      <td>{r.region}</td>
                      <td className={ecart > 0 ? "td-alert" : "td-success"}>{Math.round(r.priceObserved)} F</td>
                      <td>{Math.round(r.officialPrice)} F</td>
                      <td className={ecart > 0 ? "td-alert" : "td-success"}>{ecart !== null ? `${ecart > 0 ? "+" : ""}${ecart}%` : "—"}</td>
                      <td><span className={`etiquette ${prioriteClasse[r.priority] || "etiquette-normal"}`}>{prioriteFr[r.priority] || r.priority}</span></td>
                      <td><span className={`etiquette ${statutClasse[r.status] || "etiquette-attente"}`}>{statutFr[r.status] || r.status}</span></td>
                      <td>
                        {r.status === "PENDING" && <button className="btn-principal" style={{ padding: "4px 10px", fontSize: 9 }}>Traiter</button>}
                        {r.status !== "PENDING" && <button className="btn-secondaire" style={{ padding: "4px 10px", fontSize: 9 }}>Voir</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}