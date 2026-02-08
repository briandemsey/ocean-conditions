import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AthleteSearch() {
  const { user, authHeaders } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetch(`/api/athletes/search?q=${encodeURIComponent(query.trim())}`, {
        headers: authHeaders(),
      })
        .then(res => res.json())
        .then(data => { setResults(data); setSearched(true); setLoading(false) })
        .catch(() => { setResults([]); setLoading(false) })
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-white/70 mb-4"
           style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <Link to="/feed" className="hover:text-[#4a9eed] transition-colors">Feed</Link>
        <span>/</span>
        <span className="text-white">Athletes</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
        Find Athletes
      </h1>

      <div className="relative max-w-xl mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7eb8e0]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round"
               strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full pl-12 pr-5 py-3 rounded-xl bg-[#112240]/90
                     backdrop-blur-sm border border-[#1e3a5f] text-white
                     placeholder-[#7eb8e0]/50 focus:outline-none
                     focus:border-[#4a9eed] focus:ring-1 focus:ring-[#4a9eed]
                     transition-all"
          autoFocus
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="loading-shimmer h-16 rounded-lg" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg overflow-hidden">
          {results.map((athlete) => (
            <Link
              key={athlete.id}
              to={`/athlete/${athlete.username}`}
              className="flex items-center justify-between px-4 py-3
                         hover:bg-[#1e3a5f]/50 transition-colors
                         border-b border-white/5 last:border-b-0"
            >
              <div>
                <span className="text-[#4a9eed] font-medium">{athlete.username}</span>
                {athlete.is_self && (
                  <span className="ml-2 text-xs text-[#c084fc]">(you)</span>
                )}
                <div className="text-xs text-white/50 mt-0.5">
                  Joined {new Date(athlete.created_at).toLocaleDateString('en-US', {
                    month: 'short', year: 'numeric'
                  })}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span>{athlete.session_count} sessions</span>
                <span>{athlete.follower_count} followers</span>
                {user && !athlete.is_self && athlete.is_following && (
                  <span className="text-xs text-[#c084fc] border border-[#c084fc]/30
                                   px-2 py-0.5 rounded">Following</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : searched ? (
        <div className="text-center py-12">
          <p className="text-white/50">No athletes found for &ldquo;{query}&rdquo;</p>
        </div>
      ) : null}
    </div>
  )
}
