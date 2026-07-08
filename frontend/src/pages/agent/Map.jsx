import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../api/axios'
import { statutLabel, prioriteLabel } from '../../utils/labels'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PRIORITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', NORMAL: '#3b82f6', LOW: '#22c55e' }

const priorityIcon = priority => L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${PRIORITY_COLORS[priority] || '#6b7280'};border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,.5)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

export default function AgentMap() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    api.get('/reports/alerts').then(r => setAlerts(r.data.filter(x => x.lat && x.lng)))
  }, [])

  const verify = async id => {
    await api.patch(`/reports/${id}/status`, { status: 'VERIFIED' })
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'VERIFIED' } : a))
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Carte des alertes terrain</h2>
        <p className="text-gray-500 text-sm">{alerts.length} alerte(s) géolocalisée(s) · Cliquez sur un marqueur pour vérifier</p>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 flex gap-4 text-xs text-gray-600 flex-wrap">
        {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
          <div key={p} className="flex items-center gap-1.5">
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            <span>{prioriteLabel(p)}</span>
          </div>
        ))}
        <span className="ml-auto text-gray-400">{alerts.filter(a => a.priority === 'CRITICAL').length} critiques • {alerts.filter(a => a.status === 'PENDING').length} en attente</span>
      </div>

      <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100" style={{ height: '580px' }}>
        <MapContainer center={[14.6937, -17.4441]} zoom={7} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {alerts.map(a => (
            <Marker key={a.id} position={[a.lat, a.lng]} icon={priorityIcon(a.priority)}>
              <Popup>
                <div className="text-sm min-w-48">
                  <div style={{ color: PRIORITY_COLORS[a.priority] }} className="font-bold mb-1">
                    {prioriteLabel(a.priority)} — {a.productName}
                  </div>
                  <div className="text-xs text-gray-500 mb-1"> {a.regionName}{a.merchantName ? ' · ' + a.merchantName : ''}</div>
                  <div className="flex gap-2 text-xs mb-2">
                    <span className="text-red-600 font-semibold">{Math.round(a.priceObserved)} F observé</span>
                    {a.officialPrice && <span className="text-gray-400">/ {Math.round(a.officialPrice)} F officiel</span>}
                  </div>
                  {a.description && <p className="text-xs text-gray-400 italic mb-2">"{a.description.slice(0, 80)}"</p>}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {statutLabel(a.status)}
                    </span>
                    {a.status === 'PENDING' && (
                      <button onClick={() => verify(a.id)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                         Vérifier
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Cercle rouge autour des zones critiques */}
          {alerts.filter(a => a.priority === 'CRITICAL').map(a => (
            <Circle key={`c-${a.id}`} center={[a.lat, a.lng]} radius={800}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1, dashArray: '5,5' }} />
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
