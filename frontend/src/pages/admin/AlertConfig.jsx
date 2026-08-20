import { useState, useEffect } from 'react'
import api from '../../api/axios'

const DEFAULTS = { lowThreshold: 0, highThreshold: 10, criticalThreshold: 20 }

export default function AlertConfig() {
  const [form, setForm]       = useState(DEFAULTS)
  const [meta, setMeta]       = useState({ updatedAt: null, updatedBy: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.get('/admin/alert-config')
      .then(r => {
        setForm({
          lowThreshold: r.data.lowThreshold,
          highThreshold: r.data.highThreshold,
          criticalThreshold: r.data.criticalThreshold,
        })
        setMeta({ updatedAt: r.data.updatedAt, updatedBy: r.data.updatedBy })
      })
      .catch(() => setError("Impossible de charger la configuration actuelle."))
      .finally(() => setLoading(false))
  }, [])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setSuccess('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setSaving(true)
    try {
      const res = await api.put('/admin/alert-config', form)
      setSuccess(res.data.message || 'Seuils mis à jour.')
      setMeta({ updatedAt: res.data.config?.updatedAt, updatedBy: res.data.config?.updatedBy })
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  // Simulateur : montre en direct la priorité obtenue pour un écart donné
  const [simEcart, setSimEcart] = useState(15)
  function simulatedPriority(ecart) {
    if (ecart >= form.criticalThreshold) return { label: 'CRITICAL', color: 'bg-red-100 text-red-700 border-red-300' }
    if (ecart >= form.highThreshold)     return { label: 'HIGH',     color: 'bg-orange-100 text-orange-700 border-orange-300' }
    if (ecart <= form.lowThreshold)      return { label: 'LOW',      color: 'bg-gray-100 text-gray-600 border-gray-300' }
    return { label: 'NORMAL', color: 'bg-blue-100 text-blue-700 border-blue-300' }
  }
  const sim = simulatedPriority(simEcart)

  if (loading) return <div className="py-12 text-center text-gray-400">Chargement...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seuils d'alerte automatique</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ces seuils déterminent la priorité attribuée automatiquement à un signalement,
          en fonction de l'écart (%) entre le prix constaté et le prix officiel.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error   && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2">{success}</div>}

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            <span>Seuil LOW <span className="text-gray-400 font-normal">— écart ≤ à cette valeur</span></span>
            <span className="text-gray-500">{form.lowThreshold} %</span>
          </label>
          <input type="number" step="0.5" value={form.lowThreshold}
            onChange={e => update('lowThreshold', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            <span>Seuil HIGH <span className="text-gray-400 font-normal">— écart ≥ à cette valeur</span></span>
            <span className="text-orange-500">{form.highThreshold} %</span>
          </label>
          <input type="number" step="0.5" value={form.highThreshold}
            onChange={e => update('highThreshold', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            <span>Seuil CRITICAL <span className="text-gray-400 font-normal">— écart ≥ à cette valeur</span></span>
            <span className="text-red-500">{form.criticalThreshold} %</span>
          </label>
          <input type="number" step="0.5" value={form.criticalThreshold}
            onChange={e => update('criticalThreshold', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
          {saving ? 'Enregistrement...' : 'Enregistrer les seuils'}
        </button>

        {meta.updatedAt && (
          <p className="text-xs text-gray-400 text-center">
            Dernière modification {meta.updatedBy ? `par ${meta.updatedBy}` : ''} le{' '}
            {new Date(meta.updatedAt).toLocaleString('fr-FR')}
          </p>
        )}
      </form>

      {/* Simulateur */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Simuler un écart de prix</h2>
        <input type="range" min="-20" max="40" value={simEcart}
          onChange={e => setSimEcart(Number(e.target.value))}
          className="w-full" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Écart simulé : <strong>{simEcart} %</strong></span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${sim.color}`}>
            {sim.label}
          </span>
        </div>
      </div>
    </div>
  )
}
