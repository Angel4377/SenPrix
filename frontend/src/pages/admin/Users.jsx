import { useState, useEffect } from 'react'
import api from '../../api/axios'

const ROLE_META = {
  ADMIN:    { label: 'Admin',      color: 'bg-purple-100 text-purple-700' },
  CONSUMER: { label: 'Consommateur', color: 'bg-blue-100 text-blue-700' },
  AGENT:    { label: 'Agent',      color: 'bg-orange-100 text-orange-700' },
  MERCHANT: { label: 'Commerçant', color: 'bg-green-100 text-green-700' },
}
const ROLES = Object.keys(ROLE_META)

export default function Users() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [roleFilter, setRoleFilter] = useState('Tous')
  const [search, setSearch]   = useState('')
  const [busyId, setBusyId]   = useState(null)

  function load() {
    setLoading(true)
    api.get('/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => setError("Impossible de charger la liste des utilisateurs."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'Tous' || u.role === roleFilter
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  async function changeRole(user, newRole) {
    if (newRole === user.role) return
    if (!confirm(`Changer le rôle de ${user.name} en ${ROLE_META[newRole].label} ?`)) return
    setBusyId(user.id)
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
    } catch (e) {
      alert(e.response?.data?.message || "Erreur lors du changement de rôle.")
    } finally {
      setBusyId(null)
    }
  }

  async function toggleActive(user) {
    const nextActive = !user.active
    if (!confirm(`${nextActive ? 'Réactiver' : 'Désactiver'} le compte de ${user.name} ?`)) return
    setBusyId(user.id)
    try {
      await api.patch(`/admin/users/${user.id}/status`, { active: nextActive })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: nextActive } : u))
    } catch (e) {
      alert(e.response?.data?.message || "Erreur lors de la mise à jour du compte.")
    } finally {
      setBusyId(null)
    }
  }

  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs & rôles</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gérer les comptes de la plateforme : changer un rôle, activer ou désactiver un accès.
        </p>
      </div>

      {/* KPIs par rôle */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLES.map(r => (
          <div key={r} className="rounded-xl border border-gray-200 bg-white p-4">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${ROLE_META[r].color}`}>
              {ROLE_META[r].label}
            </span>
            <p className="text-2xl font-black text-gray-800">{counts[r] || 0}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {['Tous', ...ROLES].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                roleFilter === r ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {r === 'Tous' ? 'Tous' : ROLE_META[r].label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
        />
        <p className="text-xs text-gray-400">{filtered.length} utilisateur(s)</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Chargement...</div>
        ) : error ? (
          <div className="py-12 text-center text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Aucun utilisateur trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Nom', 'Email', 'Région', 'Rôle', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${!u.active ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.region || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={e => changeRole(u, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${ROLE_META[u.role].color}`}>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.active ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => toggleActive(u)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                          u.active
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}>
                        {u.active ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Note : vous ne pouvez pas modifier votre propre rôle ni désactiver votre propre compte, pour éviter de vous verrouiller hors de la plateforme.
      </p>
    </div>
  )
}
