import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SessionCard from '../components/SessionCard'
import { useAuth } from '../context/AuthContext'

export default function Feed() {
  const { user, authHeaders } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    const url = filter === 'following' ? '/api/feed?filter=following' : '/api/feed'
    fetch(url, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => { setSessions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-white/70 mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <Link to="/" className="hover:text-[#4a9eed] transition-colors">Search</Link>
        <span>/</span>
        <span className="text-white">Feed</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {filter === 'following' ? 'Following' : 'Recent Sessions'}
          </h1>
          {user && (
            <div className="flex rounded-lg overflow-hidden border border-[#1e3a5f]">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-[#1976D2] text-white' : 'bg-[#112240] text-white/60 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('following')}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  filter === 'following' ? 'bg-[#1976D2] text-white' : 'bg-[#112240] text-white/60 hover:text-white'
                }`}
              >
                Following
              </button>
            </div>
          )}
        </div>
        {user ? (
          <Link
            to="/sessions/log"
            className="px-4 py-2 bg-[#1976D2] text-white rounded-lg text-sm font-medium hover:bg-[#1565C0] transition-colors"
          >
            Log Session
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 bg-[#1976D2] text-white rounded-lg text-sm font-medium hover:bg-[#1565C0] transition-colors"
          >
            Log In to Track Sessions
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="loading-shimmer h-28" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/60 text-lg mb-2">No sessions yet</p>
          <p className="text-white/40 text-sm">Be the first to log a surf session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} showUser />
          ))}
        </div>
      )}
    </div>
  )
}
