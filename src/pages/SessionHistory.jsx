import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SessionCard from '../components/SessionCard'
import spots from '../data/spots'
import { useAuth } from '../context/AuthContext'

export default function SessionHistory() {
  const { user, authHeaders, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [spotFilter, setSpotFilter] = useState('')

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  function fetchSessions(spotId) {
    if (!user) return
    setLoading(true)
    const url = spotId ? `/api/sessions?spotId=${spotId}` : '/api/sessions'
    fetch(url, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => { setSessions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { if (user) fetchSessions(spotFilter) }, [spotFilter, user])

  function handleDelete(id) {
    if (!confirm('Delete this session?')) return
    fetch(`/api/sessions/${id}`, { method: 'DELETE', headers: authHeaders() })
      .then((res) => {
        if (res.ok) setSessions((prev) => prev.filter((s) => s.id !== id))
      })
  }

  if (authLoading) return null

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/70 mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <Link to="/" className="hover:text-[#4a9eed] transition-colors">Search</Link>
        <span>/</span>
        <span className="text-white">Sessions</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          Session History
        </h1>
        <div className="flex gap-2">
          <Link
            to="/sessions/stats"
            className="px-4 py-2 bg-[#112240] border border-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:border-[#4a9eed] transition-colors"
          >
            View Stats
          </Link>
          <Link
            to="/sessions/log"
            className="px-4 py-2 bg-[#1976D2] text-white rounded-lg text-sm font-medium hover:bg-[#1565C0] transition-colors"
          >
            Log Session
          </Link>
        </div>
      </div>

      {/* Spot filter */}
      <div className="mb-4">
        <select
          value={spotFilter}
          onChange={(e) => setSpotFilter(e.target.value)}
          className="px-3 py-2 bg-[#112240] border border-[#1e3a5f] rounded-lg text-sm text-white focus:border-[#4a9eed] focus:outline-none"
        >
          <option value="">All Spots</option>
          {spots.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="loading-shimmer h-28" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/60 text-lg mb-2">No sessions yet</p>
          <p className="text-white/40 text-sm mb-6">Log your first surf session to start tracking.</p>
          <Link
            to="/sessions/log"
            className="px-5 py-3 bg-[#1976D2] text-white rounded-lg font-medium hover:bg-[#1565C0] transition-colors"
          >
            Log Your First Session
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
