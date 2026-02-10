import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import spots from '../data/spots'
import { useAuth } from '../context/AuthContext'

const RATING_LABELS = ['Flat', 'Very Poor', 'Poor', 'Poor-Fair', 'Fair', 'Good', 'Epic']

export default function SurfAlerts() {
  const { user, authHeaders, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [spotId, setSpotId] = useState('')
  const [minWaveHeightFt, setMinWaveHeightFt] = useState('')
  const [maxWindSpeedKts, setMaxWindSpeedKts] = useState('')
  const [minRating, setMinRating] = useState('')

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (user) fetchAlerts()
  }, [user])

  function fetchAlerts() {
    setLoading(true)
    fetch('/api/alerts', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => { setAlerts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)

    const spot = spots.find(s => s.id === spotId)
    if (!spot) { setError('Please select a spot'); return }

    const hasCriteria = minWaveHeightFt || maxWindSpeedKts || minRating
    if (!hasCriteria) { setError('Set at least one criteria'); return }

    setSubmitting(true)
    try {
      const body = {
        spot_id: spot.id,
        spot_name: spot.name,
        min_wave_height: minWaveHeightFt ? Number(minWaveHeightFt) / 3.28084 : null,
        max_wind_speed: maxWindSpeedKts ? Number(maxWindSpeedKts) / 1.94384 : null,
        min_rating: minRating ? Number(minRating) : null,
      }
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create alert')
        return
      }
      const data = await res.json()
      setAlerts(data)
      setSpotId('')
      setMinWaveHeightFt('')
      setMaxWindSpeedKts('')
      setMinRating('')
    } catch {
      setError('Failed to create alert')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(id) {
    const res = await fetch(`/api/alerts/${id}/toggle`, {
      method: 'PUT',
      headers: authHeaders(),
    })
    if (res.ok) {
      const data = await res.json()
      setAlerts(data)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this alert?')) return
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) {
      setAlerts(prev => prev.filter(a => a.id !== id))
    }
  }

  function formatCriteria(alert) {
    const parts = []
    if (alert.min_wave_height != null) {
      parts.push(`Waves ${(alert.min_wave_height * 3.28084).toFixed(1)}ft+`)
    }
    if (alert.max_wind_speed != null) {
      parts.push(`Wind < ${(alert.max_wind_speed * 1.94384).toFixed(0)}kts`)
    }
    if (alert.min_rating != null) {
      parts.push(`Rating ${RATING_LABELS[alert.min_rating] || alert.min_rating}+`)
    }
    return parts.join(' / ')
  }

  if (authLoading) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
        Surf Alerts
      </h1>

      {/* Create Alert Form */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Create Alert</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Spot</label>
            <select
              value={spotId}
              onChange={e => setSpotId(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select a spot...</option>
              {spots.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Min Wave Height (ft)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={minWaveHeightFt}
                onChange={e => setMinWaveHeightFt(e.target.value)}
                placeholder="e.g. 3"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Max Wind Speed (kts)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={maxWindSpeedKts}
                onChange={e => setMaxWindSpeedKts(e.target.value)}
                placeholder="e.g. 10"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Min Rating</label>
              <select
                value={minRating}
                onChange={e => setMinRating(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Any</option>
                {RATING_LABELS.map((label, i) => (
                  <option key={i} value={i}>{label} ({i})</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#1976D2] hover:bg-[#1565C0] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Alert'}
          </button>
        </form>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-white/50 text-sm">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
            <p className="text-white/40 text-sm">No alerts yet. Create one above to get notified when conditions match.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center justify-between gap-4 ${!alert.is_active ? 'opacity-50' : ''}`}
            >
              <div className="min-w-0">
                <h3 className="text-white font-medium text-sm truncate">{alert.spot_name}</h3>
                <p className="text-white/60 text-xs mt-1">{formatCriteria(alert)}</p>
                {alert.last_triggered_at && (
                  <p className="text-white/30 text-xs mt-1">Last triggered: {new Date(alert.last_triggered_at + 'Z').toLocaleString()}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(alert.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    alert.is_active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-white/10 text-white/40 hover:bg-white/20'
                  }`}
                >
                  {alert.is_active ? 'Active' : 'Paused'}
                </button>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
