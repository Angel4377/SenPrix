import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// ── Intercepteur requête : injecte l'access token ────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Intercepteur réponse : auto-refresh si 401 ───────────────────────────────
let isRefreshing = false
let failedQueue = [] // requêtes en attente pendant le refresh

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // Si 401 et pas déjà une tentative de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('mw_refresh_token')

      // Pas de refresh token → déconnexion immédiate
      if (!refreshToken) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Mettre en file les requêtes pendant le refresh en cours
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken })
        const { token, refreshToken: newRefresh } = res.data

        // Mise à jour des tokens en localStorage
        localStorage.setItem('mw_token', token)
        localStorage.setItem('mw_refresh_token', newRefresh)

        api.defaults.headers.common.Authorization = `Bearer ${token}`
        originalRequest.headers.Authorization = `Bearer ${token}`

        processQueue(null, token)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
