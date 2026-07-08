import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEMO = [
  { label: 'Admin DCI',     email: 'admin@dci.sn',     password: 'admin123',    color: 'purple' },
  { label: 'Consommateur',  email: 'consumer@test.sn',  password: 'consumer123', color: 'blue' },
  { label: 'Agent Brigade', email: 'agent@dci.sn',      password: 'agent123',    color: 'orange' },
  { label: 'Commerçant',    email: 'merchant@test.sn',  password: 'merchant123', color: 'green' },
]

const colorMap = {
  purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800',
  blue:   'bg-blue-50   hover:bg-blue-100   border-blue-200   text-blue-800',
  orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800',
  green:  'bg-green-50  hover:bg-green-100  border-green-200  text-green-800',
}


export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
           style={{ background: 'linear-gradient(145deg, #064e3b 0%, #065f46 40%, #047857 70%, #059669 100%)' }}>

        {/* Cercles décoratifs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #34d399, transparent)' }}/>
        <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }}/>
        <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #fff, transparent)' }}/>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.svg" alt="Sama Prix Logo" className="w-14 h-14 rounded-2xl shadow-lg"/>
            <div>
              <h1 className="text-white font-black text-2xl tracking-tight">Sama Prix</h1>
              <p className="text-green-300 text-xs font-medium">Surveillance des marchés · Sénégal</p>
            </div>
          </div>
        </div>

        {/* Texte central */}
        <div className="relative z-10">
          <h2 className="text-white font-black text-4xl leading-tight mb-4">
            Surveillance<br />
            <span className="text-yellow-400">participative</span><br />
            des marchés
          </h2>
          <p className="text-green-200 text-sm leading-relaxed mb-10 max-w-xs">
            Plateforme officielle de régulation des prix au Sénégal,
            développée pour la Direction du Commerce Intérieur.
          </p>

        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-green-400 text-xs">
            DITI5 · ISI Dakar · 2025/2026
          </p>
        </div>
      </div>

      {/* ── Panneau droit — Formulaire ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-gray-50">

        {/* Logo mobile uniquement */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src="/logo.svg" alt="Sama Prix Logo" className="w-12 h-12 rounded-xl shadow"/>
          <div>
            <h1 className="font-black text-gray-800 text-lg">Sama Prix</h1>
            <p className="text-green-600 text-xs">Surveillance des marchés · Sénégal</p>
          </div>
        </div>

        <div className="w-full max-w-md">

          {/* En-tête formulaire */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900">Connexion</h2>
            <p className="text-gray-500 text-sm mt-1">Accédez à votre espace de surveillance</p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <span>{error}</span>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">

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
                  type={showPwd ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            {/* Bouton */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: loading ? '#6b7280' : 'linear-gradient(135deg, #059669, #047857)' }}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Connexion en cours…
                  </span>
                : 'Se connecter'}
            </button>
          </form>

          {/* Lien inscription */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold">
              Créer un compte
            </Link>
          </p>

          {/* Comptes démo */}
          <div className="mt-7 pt-6 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
              Comptes de démonstration
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map(d => (
                <button
                  key={d.email}
                  onClick={() => { setEmail(d.email); setPassword(d.password) }}
                  className={`text-left p-2.5 rounded-xl border transition-all hover:scale-[1.02] active:scale-100 ${colorMap[d.color]}`}
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-xs font-bold leading-tight">{d.label}</p>
                      <p className="text-xs opacity-50 font-mono">{d.password}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
