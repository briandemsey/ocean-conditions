import { useState, useRef, useEffect, useCallback } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Search from './pages/Search'
import SpotOverview from './pages/SpotOverview'
import ForecastBar from './pages/ForecastBar'
import ForecastDetail from './pages/ForecastDetail'
import MultiSource from './pages/MultiSource'
import NearbySpots from './pages/NearbySpots'
import LogSession from './pages/LogSession'
import SessionHistory from './pages/SessionHistory'
import SessionStats from './pages/SessionStats'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import AthleteProfile from './pages/AthleteProfile'
import Leaderboards from './pages/Leaderboards'
import AthleteSearch from './pages/AthleteSearch'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr + 'Z').getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, authHeaders } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const hamburgerRef = useRef(null)

  // Notification state
  const [notifCount, setNotifCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const notifRef = useRef(null)
  const notifBtnRef = useRef(null)

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/notifications/unread-count', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setNotifCount(data.count)
      }
    } catch {}
  }, [user, authHeaders])

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/notifications', { headers: authHeaders() })
      if (res.ok) {
        setNotifications(await res.json())
      }
    } catch {}
  }, [user, authHeaders])

  // Poll unread count every 60s
  useEffect(() => {
    if (!user) { setNotifCount(0); setNotifications([]); return }
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [user, fetchUnreadCount])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (notifOpen) fetchNotifications()
  }, [notifOpen, fetchNotifications])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

  // Close menu and notification dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuOpen &&
        menuRef.current && !menuRef.current.contains(e.target) &&
        hamburgerRef.current && !hamburgerRef.current.contains(e.target)
      ) {
        setMenuOpen(false)
      }
      if (
        notifOpen &&
        notifRef.current && !notifRef.current.contains(e.target) &&
        notifBtnRef.current && !notifBtnRef.current.contains(e.target)
      ) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen, notifOpen])

  async function handleMarkAllRead() {
    await fetch('/api/notifications/read-all', { method: 'PUT', headers: authHeaders() })
    setNotifCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
  }

  async function handleNotifClick(n) {
    if (!n.is_read) {
      fetch(`/api/notifications/${n.id}/read`, { method: 'PUT', headers: authHeaders() })
      setNotifCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x))
    }
    setNotifOpen(false)
    if (n.type === 'follow') {
      navigate(`/athlete/${n.actor_username}`)
    } else if (n.session_id) {
      navigate(`/sessions`)
    }
  }

  function notifText(n) {
    if (n.type === 'kudos') return `gave kudos on your session${n.spot_name ? ` at ${n.spot_name}` : ''}`
    if (n.type === 'comment') return `commented on your session${n.spot_name ? ` at ${n.spot_name}` : ''}`
    if (n.type === 'follow') return 'started following you'
    return ''
  }

  const notifDropdown = (
    <div ref={notifRef} className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[#0f1d32] border border-white/10 rounded-lg shadow-xl z-[60]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-sm font-semibold text-white">Notifications</span>
        {notifCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-xs text-[#4a9eed] hover:text-[#6bb5ff]">Mark all as read</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-white/40">No notifications yet</div>
      ) : (
        notifications.map(n => (
          <button
            key={n.id}
            onClick={() => handleNotifClick(n)}
            className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-start gap-2 ${!n.is_read ? 'bg-[#4a9eed]/10' : ''}`}
          >
            {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#4a9eed] flex-shrink-0" />}
            <div className={!n.is_read ? '' : 'ml-4'}>
              <p className="text-sm text-white/90">
                <span className="font-medium text-[#c084fc]">{n.actor_username}</span>{' '}
                {notifText(n)}
              </p>
              <p className="text-xs text-white/40 mt-0.5">{timeAgo(n.created_at)}</p>
            </div>
          </button>
        ))
      )}
    </div>
  )

  return (
    <>
      {/* Fixed background image that covers the entire viewport */}
      <div
        className="fixed inset-0 -z-20"
        style={{
          backgroundImage: 'url(/images/ocean-bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      />
      {/* Single uniform tint — same opacity everywhere */}
      <div className="fixed inset-0 -z-10 bg-[#0a1628]/70" />

      <div className="min-h-screen flex flex-col relative overflow-x-hidden">
        {/* Nav bar */}
        <nav className="bg-[#0a1628]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1976D2] to-[#7B1FA2] flex items-center justify-center text-white font-bold text-sm">
                AS
              </div>
              <div style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
                <span className="text-lg font-bold text-white tracking-tight">ActionSports.World</span>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-4">
              {user && (
                <div className="relative">
                  <button
                    ref={notifBtnRef}
                    onClick={() => setNotifOpen(prev => !prev)}
                    className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                  >
                    Notifications{notifCount > 0 && ` (${notifCount > 99 ? '99+' : notifCount})`}
                  </button>
                  {notifOpen && notifDropdown}
                </div>
              )}
              <Link to="/feed" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Feed</Link>
              <Link to="/leaderboards" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Leaderboards</Link>
              <Link to="/athletes" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Athletes</Link>
              {user ? (
                <>
                  <Link to="/sessions" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>My Sessions</Link>
                  <Link to="/sessions/log" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Log Session</Link>
                  <Link to="/" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Spot Reviews</Link>
                  <Link to={`/athlete/${user.username}`} className="text-sm text-[#c084fc] hover:text-[#d4a5ff] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{user.username}</Link>
                  <button onClick={logout} className="text-sm text-white/40 hover:text-red-400 transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Logout</button>
                </>
              ) : (
                <Link to="/login" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Log In</Link>
              )}
              <Link to="/" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Search Spots</Link>
            </div>

            {/* Mobile notifications + hamburger */}
            <div className="sm:hidden flex items-center gap-3">
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(prev => !prev)}
                    className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                  >
                    Notifications{notifCount > 0 && ` (${notifCount > 99 ? '99+' : notifCount})`}
                  </button>
                  {notifOpen && notifDropdown}
                </div>
              )}
              <button
                ref={hamburgerRef}
                onClick={() => setMenuOpen(prev => !prev)}
                className="p-1 text-white/70 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <div
            ref={menuRef}
            className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              <Link to="/feed" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors py-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Feed</Link>
              <Link to="/leaderboards" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors py-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Leaderboards</Link>
              <Link to="/athletes" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors py-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Athletes</Link>
              {user ? (
                <>
                  <Link to="/sessions" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors py-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>My Sessions</Link>
                  <Link to="/sessions/log" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors py-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Log Session</Link>
                  <Link to="/" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors py-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Spot Reviews</Link>
                  <Link to={`/athlete/${user.username}`} className="text-sm text-[#c084fc] hover:text-[#d4a5ff] transition-colors py-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{user.username}</Link>
                  <button onClick={logout} className="text-sm text-white/40 hover:text-red-400 transition-colors py-1 text-left" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Logout</button>
                </>
              ) : (
                <Link to="/login" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors py-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Log In</Link>
              )}
              <Link to="/" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors py-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Search Spots</Link>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main key={location.pathname} className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/spot/:spotId" element={<SpotOverview />} />
            <Route path="/spot/:spotId/forecast" element={<ForecastBar />} />
            <Route path="/spot/:spotId/forecast/:day" element={<ForecastDetail />} />
            <Route path="/spot/:spotId/compare" element={<MultiSource />} />
            <Route path="/spot/:spotId/nearby" element={<NearbySpots />} />
            <Route path="/sessions" element={<SessionHistory />} />
            <Route path="/sessions/log" element={<LogSession />} />
            <Route path="/sessions/log/:spotId" element={<LogSession />} />
            <Route path="/sessions/stats" element={<SessionStats />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/athletes" element={<AthleteSearch />} />
            <Route path="/athlete/:username" element={<AthleteProfile />} />
            <Route path="/leaderboards" element={<Leaderboards />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-[#0a1628]/80 backdrop-blur-md border-t border-white/10 px-4 sm:px-6 py-4 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/70">
            <span>H-Consult Action Sports Platform</span>
            <span className="flex items-center gap-3">
              <Link to="/terms" className="hover:text-[#4a9eed] transition-colors">Terms of Use</Link>
              <span className="text-white/30">|</span>
              <Link to="/privacy" className="hover:text-[#4a9eed] transition-colors">Privacy Policy</Link>
              <span className="text-white/30">|</span>
              <span>Multi-source ocean data powered by StormGlass & Open-Meteo</span>
            </span>
          </div>
        </footer>
      </div>
    </>
  )
}
