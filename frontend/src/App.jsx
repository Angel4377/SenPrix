import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages communes
import Login         from './pages/Login'
import Layout        from './components/Layout'
import Notifications from './pages/Notifications'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminPrices    from './pages/admin/Prices'
import AdminReports   from './pages/admin/Reports'
import AdminMap       from './pages/admin/Map'
import AdminImport    from './pages/admin/Import'
import AdminAnalytics  from './pages/admin/Analytics'
import AdminAuditLogs from './pages/admin/AuditLogs'
import AdminUsers      from './pages/admin/Users'
import AdminAlertConfig from './pages/admin/AlertConfig'

// Consumer
import ConsumerHome         from './pages/consumer/Home'
import ConsumerReport       from './pages/consumer/ReportForm'
import ConsumerCompare      from './pages/consumer/Compare'
import ConsumerMyReports    from './pages/consumer/MyReports'

// Agent
import AgentDashboard  from './pages/agent/Dashboard'
import AgentMissions   from './pages/agent/Missions'
import AgentMap        from './pages/agent/Map'
import AgentInfraction from './pages/agent/Infraction'

// Merchant
import MerchantPrices  from './pages/merchant/Prices'
import MerchantReports from './pages/merchant/Reports'

function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  switch (user.role) {
    case 'ADMIN':    return <Navigate to="/admin/dashboard" replace />
    case 'CONSUMER': return <Navigate to="/consumer/home" replace />
    case 'AGENT':    return <Navigate to="/agent/dashboard" replace />
    case 'MERCHANT': return <Navigate to="/merchant/prices" replace />
    default:         return <Navigate to="/login" replace />
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* ── ADMIN ── */}
          <Route path="/admin" element={<ProtectedRoute role="ADMIN"><Layout /></ProtectedRoute>}>
            <Route path="dashboard"  element={<AdminDashboard />} />
            <Route path="prices"     element={<AdminPrices />} />
            <Route path="reports"    element={<AdminReports />} />
            <Route path="map"        element={<AdminMap />} />
            <Route path="import"     element={<AdminImport />} />
            <Route path="analytics"    element={<AdminAnalytics />} />
            <Route path="audit-logs"   element={<AdminAuditLogs />} />
            <Route path="users"        element={<AdminUsers />} />
            <Route path="alert-config" element={<AdminAlertConfig />} />
          </Route>

          {/* ── CONSUMER ── */}
          <Route path="/consumer" element={<ProtectedRoute role="CONSUMER"><Layout /></ProtectedRoute>}>
            <Route path="home"         element={<ConsumerHome />} />
            <Route path="report"       element={<ConsumerReport />} />
            <Route path="compare"      element={<ConsumerCompare />} />
            <Route path="my-reports"   element={<ConsumerMyReports />} />
          </Route>

          {/* ── AGENT ── */}
          <Route path="/agent" element={<ProtectedRoute role="AGENT"><Layout /></ProtectedRoute>}>
            <Route path="dashboard"  element={<AgentDashboard />} />
            <Route path="missions"   element={<AgentMissions />} />
            <Route path="map"        element={<AgentMap />} />
            <Route path="infraction" element={<AgentInfraction />} />
          </Route>

          {/* ── MERCHANT ── */}
          <Route path="/merchant" element={<ProtectedRoute role="MERCHANT"><Layout /></ProtectedRoute>}>
            <Route path="prices"  element={<MerchantPrices />} />
            <Route path="reports" element={<MerchantReports />} />
          </Route>

          {/* ── NOTIFICATIONS (tous rôles) ── */}
          <Route path="/notifications" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
