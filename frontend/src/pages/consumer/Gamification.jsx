import { useState, useEffect } from 'react'
import api from '../../api/axios'

const BADGES = [
  { id: 'first_report', icon: '🏁', label: 'Premier Signalement', desc: 'Avoir soumis votre 1er signalement', points: 10, threshold: 1 },
  { id: 'contributor_5', icon: '⭐', label: 'Contributeur', desc: '5 signalements validés', points: 25, threshold: 5 },
  { id: 'vigilant_20', icon: '🦅', label: 'Sentinelle', desc: '20 signalements validés', points: 100, threshold: 20 },
  { id: 'hero_50', icon: '🦁', label: 'Citoyen Actif', desc: '50 signalements validés', points: 250, threshold: 50 },
  { id: 'champion_100', icon: '🏆', label: 'Champion Citoyen', desc: '100 signalements validés', points: 500, threshold: 100 },
  { id: 'confirmed', icon: '✅', label: 'Vérificateur', desc: '10 confirmations communautaires', points: 50, threshold: 10 },
  { id: 'photo', icon: '📸', label: 'Preuve Visuelle', desc: '5 signalements avec photo', points: 30, threshold: 5 },
  { id: 'critical', icon: '🚨', label: "Détecteur d'Urgence", desc: '3 alertes critiques confirmées', points: 75, threshold: 3 },
]

const LEVELS = [
  { name: 'Observateur', min: 0, max: 49, color: 'text-gray-600', bg: 'bg-gray-100', icon: '👁️' },
  { name: 'Signaleur', min: 50, max: 149, color: 'text-blue-600', bg: 'bg-blue-100', icon: '📢' },
  { name: 'Contributeur', min: 150, max: 399, color: 'text-green-600', bg: 'bg-green-100', icon: '⭐' },
  { name: 'Sentinelle', min: 400, max: 999, color: 'text-purple-600', bg: 'bg-purple-100', icon: '🦅' },
  { name: 'Champion Citoyen', min: 1000, max: Infinity, color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '🏆' },
]

export default function Gamification() {
  const [profile, setProfile] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [tab, setTab] = useState('profile')

  useEffect(() => {
    api.get('/consumer/profile/gamification').then(r => setProfile(r.data)).catch(() => setProfile({
      totalPoints: 185, reportsCount: 23, validatedCount: 18,
      confirmationsGiven: 12, photosCount: 6, criticalAlerts: 4,
      earnedBadges: ['first_report', 'contributor_5', 'vigilant_20', 'confirmed', 'photo', 'critical'],
      rank: 7, streak: 3,
    }))
    api.get('/consumer/leaderboard').then(r => setLeaderboard(r.data)).catch(() => setLeaderboard([
      { rank: 1, name: 'Aminata D.', points: 1250, reports: 128, badge: '🏆' },
      { rank: 2, name: 'Moussa K.', points: 980, reports: 97, badge: '🦅' },
      { rank: 3, name: 'Fatou S.', points: 720, reports: 74, badge: '🦅' },
      { rank: 4, name: 'Ibrahim T.', points: 610, reports: 61, badge: '⭐' },
      { rank: 5, name: 'Aissatou B.', points: 530, reports: 53, badge: '⭐' },
      { rank: 6, name: 'Cheikh N.', points: 420, reports: 42, badge: '⭐' },
      { rank: 7, name: 'Vous', points: 185, reports: 23, badge: '⭐', isMe: true },
      { rank: 8, name: 'Rokhaya L.', points: 150, reports: 15, badge: '📢' },
      { rank: 9, name: 'Bamba F.', points: 120, reports: 12, badge: '📢' },
      { rank: 10, name: 'Oumou D.', points: 95, reports: 9, badge: '📢' },
    ]))
  }, [])

  function getLevel(points) { return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[0] }
  function getLevelProgress(points) {
    const level = getLevel(points)
    if (level.max === Infinity) return 100
    return Math.round(((points - level.min) / (level.max - level.min)) * 100)
  }

  const level = profile ? getLevel(profile.totalPoints) : null
  const progress = profile ? getLevelProgress(profile.totalPoints) : 0
  const nextLevel = profile && level ? LEVELS[LEVELS.indexOf(level) + 1] : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Espace Citoyen</h1>
      </div>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {[['profile', '👤 Mon Profil'], ['badges', '🏅 Mes Badges'], ['leaderboard', '🏆 Classement']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && profile && (
        <div className="space-y-4">
          <div className={`${level?.bg} rounded-xl p-4 sm:p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="text-5xl">{level?.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xl font-bold ${level?.color}`}>{level?.name}</span>
                    <span className="text-sm text-gray-500">— Rang #{profile.rank} national</span>
                  </div>
                  <p className="text-3xl font-black text-gray-800">{profile.totalPoints.toLocaleString()} points</p>
                  {nextLevel && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progression vers {nextLevel.name}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{nextLevel.min - profile.totalPoints} pts pour atteindre {nextLevel.name}</p>
                    </div>
                  )}
                </div>
              </div>
              {profile.streak > 1 && (
                <div className="text-center bg-orange-100 rounded-lg px-4 py-2 self-start sm:self-center">
                  <p className="text-2xl">🔥</p>
                  <p className="text-sm font-bold text-orange-600">{profile.streak} jours</p>
                  <p className="text-xs text-orange-500">en série</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '📝', label: 'Signalements', value: profile.reportsCount, sub: `${profile.validatedCount} validés` },
              { icon: '✅', label: 'Confirmations', value: profile.confirmationsGiven, sub: 'données' },
              { icon: '📸', label: 'Avec photos', value: profile.photosCount, sub: 'preuves visuelles' },
              { icon: '🚨', label: 'Alertes critiques', value: profile.criticalAlerts, sub: 'confirmées' },
            ].map(({ icon, label, value, sub }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-xs font-medium text-gray-600">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'badges' && profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BADGES.map(b => {
            const earned = profile.earnedBadges.includes(b.id)
            return (
              <div key={b.id} className={`rounded-xl border p-4 text-center transition-all ${earned ? 'border-yellow-300 bg-yellow-50 shadow-md' : 'border-gray-200 bg-white opacity-50'}`}>
                <div className={`text-4xl mb-2 ${!earned && 'grayscale'}`}>{b.icon}</div>
                <p className="font-semibold text-sm text-gray-800">{b.label}</p>
                <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
                <p className={`text-xs font-bold mt-2 ${earned ? 'text-yellow-600' : 'text-gray-400'}`}>
                  {earned ? `+ ${b.points} pts obtenus` : `+${b.points} pts`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
            <h2 className="font-bold text-lg">🏆 Classement National – Top 10</h2>
            <p className="text-yellow-100 text-sm">Mise à jour quotidienne</p>
          </div>
          <div className="divide-y divide-gray-100">
            {leaderboard.map((u, i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-3 ${u.isMe ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}>
                <div className="w-8 text-center">
                  {u.rank <= 3 ? <span className="text-2xl">{['🥇','🥈','🥉'][u.rank-1]}</span> : <span className="text-gray-400 font-bold">#{u.rank}</span>}
                </div>
                <div className="text-xl">{u.badge}</div>
                <div className="flex-1">
                  <p className={`font-semibold ${u.isMe ? 'text-blue-700' : 'text-gray-800'}`}>
                    {u.name} {u.isMe && <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">Moi</span>}
                  </p>
                  <p className="text-xs text-gray-400">{u.reports} signalements</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{u.points.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
