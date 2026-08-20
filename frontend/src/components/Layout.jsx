import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {})
    const interval = setInterval(() => {
      api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/login') }

  const navItems = () => {
    if (user?.role === 'ADMIN') return [
      { to: '/admin/dashboard',    label: 'Tableau de bord' },
      { to: '/admin/prices',       label: 'Gestion des prix' },
      { to: '/admin/import',       label: 'Import CSV/Excel' },
      { to: '/admin/reports',      label: 'Signalements' },
      { to: '/admin/map',          label: 'Carte interactive' },
      { to: '/admin/analytics',    label: 'Analyse & Export' },
      { to: '/admin/audit-logs',   label: "Journal d'audit" },
      { to: '/admin/users',        label: 'Utilisateurs & rôles' },
      { to: '/admin/alert-config', label: "Seuils d'alerte" },
    ]
    if (user?.role === 'CONSUMER') return [
      { to: '/consumer/home',         label: 'Accueil & Prix' },
      { to: '/consumer/report',       label: 'Signaler une anomalie' },
      { to: '/consumer/my-reports',   label: 'Mes signalements' },
      { to: '/consumer/compare',      label: 'Comparer les prix' },
    ]
    if (user?.role === 'AGENT') return [
      { to: '/agent/dashboard',  label: 'Tableau de bord' },
      { to: '/agent/missions',   label: 'Missions terrain' },
      { to: '/agent/map',        label: 'Carte des alertes' },
      { to: '/agent/infraction', label: "Constat d'infraction" },
    ]
    if (user?.role === 'MERCHANT') return [
      { to: '/merchant/prices',  label: 'Prix officiels' },
      { to: '/merchant/reports', label: 'Signalements reçus' },
    ]
    return []
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="logo" className="w-9 h-9 rounded-full shadow"/>
          <div>
            <h1 className="text-white font-bold text-sm">SamaPrix</h1>
            <p className="text-green-200 text-xs">Sénégal — DCI</p>
          </div>
        </div>
        {/* Bouton fermer sur mobile */}
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/60 hover:text-white text-xl leading-none">×</button>
      </div>

      {/* Nav */}
      <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
        <p className="text-green-300 text-xs font-bold uppercase tracking-wider px-2 mb-2 mt-1">
          {user?.role === 'ADMIN'    ? 'Administration DCI' :
           user?.role === 'CONSUMER' ? 'Espace Consommateur' :
           user?.role === 'AGENT'    ? 'Brigade de contrôle' : 'Espace Commerçant'}
        </p>
        {navItems().map(item => (
          <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            {item.label}
          </NavLink>
        ))}
        <div className="pt-4 mt-4 border-t border-white/20">
          <NavLink to="/notifications" onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Notifications
            {unread > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {unread}
              </span>
            )}
          </NavLink>
        </div>
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-green-200 text-xs capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-green-200 hover:text-white text-xs transition-colors">
          Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Overlay mobile (fond sombre quand sidebar ouverte) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar desktop : toujours visible ── */}
      <aside className="sidebar hidden md:flex w-64 flex-shrink-0 flex-col h-full">
        <SidebarContent />
      </aside>

      {/* ── Sidebar mobile : tiroir latéral ── */}
      <aside className={`sidebar fixed inset-y-0 left-0 w-72 flex flex-col z-40 transform transition-transform duration-300 md:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* ── Contenu principal ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Barre supérieure mobile */}
        <header className="md:hidden flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 flex flex-col justify-center gap-1"
            aria-label="Ouvrir le menu"
          >
            <span className="block w-5 h-0.5 bg-current rounded" />
            <span className="block w-5 h-0.5 bg-current rounded" />
            <span className="block w-5 h-0.5 bg-current rounded" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="logo" className="w-7 h-7 rounded-lg"/>
            <span className="font-bold text-gray-800 text-sm">Sama Prix</span>
          </div>
          {unread > 0 && (
            <NavLink to="/notifications" className="ml-auto text-sm text-gray-600 font-medium flex items-center gap-1.5">
              Notifications
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            </NavLink>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
