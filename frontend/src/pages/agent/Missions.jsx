import { useEffect, useState } from 'react'
import api from '../../api/axios'

const COLS = [
  { key: 'PLANNED', label: 'Planifiées', color: 'border-t-blue-400' },
  { key: 'IN_PROGRESS', label: 'En cours', color: 'border-t-orange-400' },
  { key: 'COMPLETED', label: 'Terminées', color: 'border-t-green-400' },
]

export default function AgentMissions() {
  const [missions, setMissions] = useState([])
  const [regions, setRegions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ regionId: '', title: '', description: '', scheduledDate: '' })
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)

  const load = () => {
    api.get('/agent/missions').then(r => setMissions(r.data))
    api.get('/regions').then(r => setRegions(r.data))
  }

  useEffect(() => { load() }, [])

  const changeStatus = async (id, status) => {
    await api.patch(`/agent/missions/${id}/status`, { status })
    load()
  }

  const handleCreate = async e => {
    e.preventDefault()
    try {
      await api.post('/agent/missions', { ...form, regionId: parseInt(form.regionId) })
      setMsg('Mission créée !')
      setMsgOk(true)
      setShowForm(false)
      setForm({ regionId: '', title: '', description: '', scheduledDate: '' })
      load()
    } catch { setMsg('Erreur lors de la création.'); setMsgOk(false) }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des missions terrain</h2>
          <p className="text-gray-500 text-sm">{missions.length} mission(s) — glissez-déposez entre colonnes ou changez le statut</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {showForm ? 'Annuler' : 'Nouvelle mission'}
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${msgOk ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Créer une mission de contrôle</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
              <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Ex: Contrôle marché Sandaga" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Région *</label>
              <select required value={form.regionId} onChange={e => setForm({...form, regionId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Sélectionner...</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date prévue *</label>
              <input required type="date" value={form.scheduledDate} onChange={e => setForm({...form, scheduledDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="md:row-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Objectifs de la mission..." />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                Créer la mission
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLS.map(col => {
          const items = missions.filter(m => m.status === col.key)
          return (
            <div key={col.key} className={`bg-white rounded-xl shadow-sm border-t-4 ${col.color} border border-gray-100`}>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 text-sm">{col.label}</h3>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">{items.length}</span>
              </div>
              <div className="p-3 space-y-3 min-h-40">
                {items.length === 0 ? (
                  <div className="text-center text-gray-300 text-xs py-8">Aucune mission</div>
                ) : items.map(m => (
                  <div key={m.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-green-200 transition-colors">
                    <p className="text-sm font-semibold text-gray-800 mb-1">{m.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{m.regionName}</p>
                    {m.scheduledDate && <p className="text-xs text-gray-400 mb-2">{m.scheduledDate}</p>}
                    {m.description && <p className="text-xs text-gray-400 italic mb-2">"{m.description.slice(0,60)}..."</p>}
                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {col.key === 'PLANNED' && (
                        <button onClick={() => changeStatus(m.id, 'IN_PROGRESS')}
                          className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 px-2 py-1 rounded">
                          Démarrer →
                        </button>
                      )}
                      {col.key === 'IN_PROGRESS' && (
                        <>
                          <button onClick={() => changeStatus(m.id, 'PLANNED')}
                            className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded">
                            ← Replanifier
                          </button>
                          <button onClick={() => changeStatus(m.id, 'COMPLETED')}
                            className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded">
                            Terminer
                          </button>
                        </>
                      )}
                      {col.key === 'COMPLETED' && (
                        <span className="text-xs text-green-600 font-medium">Mission accomplie</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
