import { useState, useRef } from 'react'
import api from '../../api/axios'

/**
 * Import en masse des prix officiels depuis fichier CSV/Excel
 * Workflow : upload fichier → aperçu des données → validation → import
 */
export default function Import() {
  const [step, setStep] = useState(1) // 1=upload, 2=preview, 3=done
  const [file, setFile] = useState(null)
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  // Colonnes attendues dans le CSV
  const EXPECTED_COLS = ['produit', 'region', 'prix_officiel', 'unite', 'date_application']

  // Parse CSV côté client pour aperçu
  function parseCSV(text) {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(';').map(h => h.trim().toLowerCase())
    const missing = EXPECTED_COLS.filter(c => !headers.includes(c))
    if (missing.length > 0) {
      return { ok: false, error: `Colonnes manquantes : ${missing.join(', ')}` }
    }
    const data = []
    const errs = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(';').map(v => v.trim())
      const row = {}
      headers.forEach((h, idx) => { row[h] = vals[idx] || '' })
      // Validation basique
      if (!row.produit) errs.push(`Ligne ${i + 1} : produit vide`)
      if (!row.region) errs.push(`Ligne ${i + 1} : région vide`)
      if (isNaN(parseFloat(row.prix_officiel))) errs.push(`Ligne ${i + 1} : prix invalide (${row.prix_officiel})`)
      data.push(row)
    }
    return { ok: true, data, errors: errs }
  }

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setErrors([])
    setRows([])
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const parsed = parseCSV(text)
      if (!parsed.ok) {
        setErrors([parsed.error])
        return
      }
      setRows(parsed.data)
      setErrors(parsed.errors)
      setStep(2)
    }
    reader.readAsText(f, 'UTF-8')
  }

  async function handleImport() {
    setImporting(true)
    try {
      // Envoyer le fichier brut au backend pour import officiel
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/admin/prices/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult({ success: true, imported: res.data.imported, skipped: res.data.skipped })
      setStep(3)
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Erreur lors de l\'import' })
      setStep(3)
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setStep(1); setFile(null); setRows([]); setErrors([]); setResult(null)
    fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Import des Prix Officiels</h1>
      </div>

      {/* Barre de progression */}
      <div className="flex items-center gap-2">
        {['Sélection fichier', 'Aperçu & Validation', 'Résultat'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${step === i + 1 ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>{label}</span>
            {i < 2 && <div className={`w-12 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* ÉTAPE 1 : Upload */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Template CSV à télécharger */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Format attendu (CSV séparé par ;)</h3>
            <code className="text-xs bg-white p-2 rounded block border text-gray-700">
              produit;region;prix_officiel;unite;date_application<br/>
              Riz brisé;Dakar;500;kg;2024-01-01<br/>
              Huile végétale;Thiès;1200;litre;2024-01-01<br/>
              Sucre cristallisé;Saint-Louis;750;kg;2024-01-01
            </code>
            <button
              onClick={() => {
                const csv = 'produit;region;prix_officiel;unite;date_application\nRiz brisé;Dakar;500;kg;2024-01-01\nHuile végétale;Thiès;1200;litre;2024-01-01\nSucre cristallisé;Saint-Louis;750;kg;2024-01-01'
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = 'template_prix.csv'; a.click()
              }}
              className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
            >
              ⬇️ Télécharger le template CSV
            </button>
          </div>

          {/* Zone de dépôt */}
          <label className="block border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-gray-600 font-medium">Cliquez pour sélectionner votre fichier</p>
            <p className="text-gray-400 text-sm mt-1">Formats acceptés : .csv, .xlsx (max 5 Mo)</p>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" onChange={handleFile} className="hidden" />
          </label>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              {errors.map((e, i) => <p key={i} className="text-red-700 text-sm">❌ {e}</p>)}
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE 2 : Aperçu */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">📄 {file?.name}</p>
              <p className="text-sm text-gray-500">{rows.length} ligne(s) détectée(s)</p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                ← Retour
              </button>
              <button
                onClick={handleImport}
                disabled={importing || errors.length > 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? '⏳ Import en cours...' : '🚀 Lancer l\'import'}
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="font-semibold text-yellow-800 text-sm mb-1">⚠️ {errors.length} avertissement(s) — l'import sera bloqué si des erreurs critiques existent</p>
              {errors.slice(0, 5).map((e, i) => <p key={i} className="text-yellow-700 text-xs">• {e}</p>)}
            </div>
          )}

          {/* Tableau aperçu */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  {EXPECTED_COLS.map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {col.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    {EXPECTED_COLS.map(col => (
                      <td key={col} className="px-4 py-2 text-gray-700">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="text-center text-xs text-gray-400 py-2">… et {rows.length - 20} lignes supplémentaires</p>
            )}
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : Résultat */}
      {step === 3 && result && (
        <div className={`rounded-xl p-8 text-center ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="text-5xl mb-4">{result.success ? '✅' : '❌'}</div>
          {result.success ? (
            <>
              <h2 className="text-xl font-bold text-green-800 mb-2">Import réussi !</h2>
              <p className="text-green-700">{result.imported} prix importés — {result.skipped} ignorés (doublons)</p>
              <p className="text-green-600 text-sm mt-1">Les prix sont maintenant actifs et visibles par les utilisateurs.</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-red-800 mb-2">Échec de l'import</h2>
              <p className="text-red-700">{result.message}</p>
            </>
          )}
          <button onClick={reset} className="mt-4 px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50">
            Faire un nouvel import
          </button>
        </div>
      )}
    </div>
  )
}
