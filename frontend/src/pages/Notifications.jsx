import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/notifications')
      .then(r => { setNotifs(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markAllRead = async () => {
    await api.post('/notifications/mark-read')
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const unread = notifs.filter(n => !n.isRead).length

  const typeIcon = {
    success: '✅',
    alert:   '🚨',
    warning: '⚠️',
    info:    'ℹ️',
  }

  const typeBg = {
    success: 'border-l-green-500 bg-green-50',
    alert:   'border-l-red-500 bg-red-50',
    warning: 'border-l-orange-400 bg-orange-50',
    info:    'border-l-blue-400 bg-blue-50',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-gray-500 text-sm mt-1">
            {unread > 0 ? `${unread} non lue(s)` : 'Tout est lu'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            ✓ Tout marquer comme lu
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-500">Aucune notification pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border border-gray-100 border-l-4 p-4 flex items-start gap-3 transition-opacity ${
                n.isRead ? 'opacity-60' : ''
              } ${typeBg[n.type] || 'border-l-gray-300'}`}
            >
              <span className="text-xl flex-shrink-0">{typeIcon[n.type] || 'ℹ️'}</span>
              <div className="flex-1">
                <p className={`text-sm ${n.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                  {n.message}
                </p>
                {n.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString('fr-SN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
