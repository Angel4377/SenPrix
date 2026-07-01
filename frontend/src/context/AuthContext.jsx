import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('mw_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    // Stocke l'access token (15 min) et le refresh token (7 jours)
    localStorage.setItem('mw_token', data.token)
    localStorage.setItem('mw_refresh_token', data.refreshToken)
    localStorage.setItem('mw_user', JSON.stringify(data))
    setUser(data)
    return data
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('mw_refresh_token')
    try {
      // Révoque le refresh token côté serveur
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch (_) {
      // Ignore les erreurs réseau lors du logout
    } finally {
      localStorage.removeItem('mw_token')
      localStorage.removeItem('mw_refresh_token')
      localStorage.removeItem('mw_user')
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
