import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ConditionCard from '../components/ConditionCard'
import SessionCard from '../components/SessionCard'
import { useAuth } from '../context/AuthContext'

export default function AthleteProfile() {
  const { username } = useParams()
  const { user, authHeaders } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [hoverUnfollow, setHoverUnfollow] = useState(false)

  const isOwnProfile = user && user.username === username

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/athletes/${encodeURIComponent(username)}`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Athlete not found' : 'Failed to load profile')
        return res.json()
      })
      .then((data) => { setProfile(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [username])

  useEffect(() => {
    if (!user || isOwnProfile) return
    fetch(`/api/follows/${encodeURIComponent(username)}/status`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setIsFollowing(data.following))
      .catch(() => {})
  }, [username, user])

  function handleFollowToggle() {
    const method = isFollowing ? 'DELETE' : 'POST'
    fetch(`/api/follows/${encodeURIComponent(username)}`, {
      method,
      headers: authHeaders(),
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setIsFollowing(data.following)
        if (profile) {
          setProfile(prev => ({
            ...prev,
            user: {
              ...prev.user,
              followers: prev.user.followers + (data.following ? 1 : -1),
            },
          }))
        }
      })
      .catch(() => {})
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="loading-shimmer h-6 w-32" />
        <div className="loading-shimmer h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="loading-shimmer h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60 text-lg mb-4">{error}</p>
        <Link to="/feed" className="text-[#4a9eed] hover:underline">Back to Feed</Link>
      </div>
    )
  }

  const { user: profileUser, stats, sessions } = profile
  const currentUser = user

  const memberSince = new Date(profileUser.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const totalHours = Math.floor(stats.total_time / 60)
  const totalMins = stats.total_time % 60
  const totalTimeStr = totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`
  const avgDurationStr = `${stats.avg_duration}m`

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/70 mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <Link to="/feed" className="hover:text-[#4a9eed] transition-colors">Feed</Link>
        <span>/</span>
        <span className="text-white">{profileUser.username}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {profileUser.username}
        </h1>
        {currentUser && !isOwnProfile && (
          <button
            onClick={handleFollowToggle}
            onMouseEnter={() => setHoverUnfollow(true)}
            onMouseLeave={() => setHoverUnfollow(false)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isFollowing
                ? hoverUnfollow
                  ? 'bg-red-500/20 border border-red-500 text-red-400'
                  : 'bg-[#112240] border border-[#1e3a5f] text-white'
                : 'bg-[#1976D2] text-white hover:bg-[#1565C0]'
            }`}
          >
            {isFollowing ? (hoverUnfollow ? 'Unfollow' : 'Following') : 'Follow'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-white/50 mb-6" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <span>Member since {memberSince}</span>
        <span><strong className="text-white/70">{profileUser.followers ?? 0}</strong> followers</span>
        <span><strong className="text-white/70">{profileUser.following ?? 0}</strong> following</span>
      </div>

      {/* Stats grid — hidden if no sessions */}
      {stats.total_sessions > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <ConditionCard title="Total Sessions" value={stats.total_sessions} accentColor="#1976D2" />
          <ConditionCard title="Total Waves" value={stats.total_waves} accentColor="#7B1FA2" />
          <ConditionCard title="Avg Duration" value={avgDurationStr} />
          <ConditionCard title="Total Time" value={totalTimeStr} />
          <ConditionCard title="Avg Rating" value={stats.avg_rating} />
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
      )}

      {/* Recent sessions */}
      <h2 className="text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
        Recent Sessions
      </h2>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/50">No sessions logged yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}
