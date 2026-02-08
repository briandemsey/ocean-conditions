import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import ConditionCard from '../components/ConditionCard'
import { useAuth } from '../context/AuthContext'

export default function SessionStats() {
  const { user, authHeaders, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    fetch('/api/sessions/stats', { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="loading-shimmer h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="loading-shimmer h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center py-20 text-white/60">Failed to load stats.</div>
  }

  const totalHours = Math.floor(stats.total_time / 60)
  const totalMins = stats.total_time % 60
  const totalTimeStr = totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`
  const avgDurationStr = `${stats.avg_duration}m`

  // Format weekly trend data for chart
  const weeklyData = (stats.weekly || []).map((w) => {
    const d = new Date(w.week_start + 'T00:00:00')
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: w.session_count,
    }
  })

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/70 mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <Link to="/sessions" className="hover:text-[#4a9eed] transition-colors">Sessions</Link>
        <span>/</span>
        <span className="text-white">Stats</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        Session Stats
      </h1>

      {stats.total_sessions === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/60 text-lg mb-2">No stats yet</p>
          <p className="text-white/40 text-sm mb-6">Log some sessions to see your stats.</p>
          <Link
            to="/sessions/log"
            className="px-5 py-3 bg-[#1976D2] text-white rounded-lg font-medium hover:bg-[#1565C0] transition-colors"
          >
            Log Your First Session
          </Link>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <ConditionCard
              title="Total Sessions"
              value={stats.total_sessions}
              accentColor="#1976D2"
            />
            <ConditionCard
              title="Total Waves"
              value={stats.total_waves}
              accentColor="#7B1FA2"
            />
            <ConditionCard
              title="Avg Duration"
              value={avgDurationStr}
            />
            <ConditionCard
              title="Total Time"
              value={totalTimeStr}
            />
            <ConditionCard
              title="Avg Rating"
              value={stats.avg_rating}
            />
            <ConditionCard
              title="Top Spot"
              value={stats.topSpot?.spot_name || '--'}
              subtitle={stats.topSpot ? `${stats.topSpot.session_count} sessions` : undefined}
            />
            {stats.topBoard && (
              <ConditionCard
                title="Top Board"
                value={stats.topBoard.board}
                subtitle={`${stats.topBoard.use_count} sessions`}
              />
            )}
          </div>

          {/* Weekly trend chart */}
          {weeklyData.length > 0 && (
            <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-3 sm:p-4">
              <h2 className="text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
                Sessions Per Week (Last 12 Weeks)
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="label" stroke="#4a6a8a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#4a6a8a" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid #1e3a5f', borderRadius: 8 }}
                    labelStyle={{ color: '#7eb8e0' }}
                  />
                  <Bar dataKey="sessions" name="Sessions" fill="#1976D2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
