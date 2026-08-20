import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const REGIONS = [
  'Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaffrine', 'Kaolack', 'Kédougou',
  'Kolda', 'Louga', 'Matam', 'Saint-Louis', 'Sédhiou', 'Tambacounda', 'Ziguinchor',
]

const ROLES = [
  { value: 'CONSUMER', label: 'Consommateur' },
  { value: 'MERCHANT', label: 'Commerçant' },
  { value: 'AGENT',    label: 'Agent Brigade' },
]

export default function Register() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [role, setRole]         = useState('CONSUMER')
  const [region, setRegion]     = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      await register({ name, email, password, role, region })
      setSuccess('Compte créé avec succès. Redirection vers la connexion…')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de créer le compte.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
           style={{ background: 'linear-gradient(145deg, #064e3b 0%, #065f46 40%, #047857 70%, #059669 100%)' }}>

        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #34d399, transparent)' }}/>
        <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }}/>
        <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #fff, transparent)' }}/>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.svg" alt="Sama Prix Logo" className="w-14 h-14 rounded-2xl shadow-lg"/>
            <div>
              <h1 className="text-white font-black text-2xl tracking-tight">Sama Prix</h1>
              <p className="text-green-300 text-xs font-medium">Surveillance des marchés · Sénégal</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-white font-black text-4xl leading-tight mb-4">
            Rejoignez<br />
            <span className="text-yellow-400">la surveillance</span><br />
            citoyenne
          </h2>
          <p className="text-green-200 text-sm leading-relaxed mb-10 max-w-xs">
            Créez votre compte pour signaler les prix, comparer les marchés
            ou contribuer à la régulation du commerce au Sénégal.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-green-400 text-xs">
            DITI5 · ISI Dakar · 2025/2026
          </p>
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-gray-50">

        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src="/logo.svg" alt="Sama Prix Logo" className="w-12 h-12 rounded-xl shadow"/>
          <div>
            <h1 className="font-black text-gray-800 text-lg">Sama Prix</h1>
            <p className="text-green-600 text-xs">Surveillance des marchés · Sénégal</p>
          </div>
        </div>

        <div className="w-full max-w-md">

          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900">Créer un compte</h2>
            <p className="text-gray-500 text-sm mt-1">Rejoignez la plateforme Sama Prix</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nom */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nom complet
              </label>
              <input
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Adresse email
              </label>
              <input
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required minLength={6}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  className="w-full px-4 pr-16 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-medium transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? 'Cacher' : 'Voir'}
                </button>
              </div>
            </div>

            {/* Rôle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Je suis un(e)
              </label>
              <select
                required
                value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Région */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Région
              </label>
              <select
                value={region} onChange={e => setRegion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
              >
                <option value="">Sélectionner une région</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Bouton */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: loading ? '#6b7280' : 'linear-gradient(135deg, #059669, #047857)' }}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Création en cours…
                  </span>
                : 'Créer mon compte'}
            </button>
          </form>

          {/* Lien connexion */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Se connecter
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
