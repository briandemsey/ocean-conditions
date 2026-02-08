import { useState, useRef, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
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

export default function App() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const hamburgerRef = useRef(null)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuOpen &&
        menuRef.current && !menuRef.current.contains(e.target) &&
        hamburgerRef.current && !hamburgerRef.current.contains(e.target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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
                <span className="text-lg font-bold text-white tracking-tight">ActionSports.cloud</span>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-4">
              <Link to="/feed" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Feed</Link>
              <Link to="/leaderboards" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Leaderboards</Link>
              <Link to="/athletes" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Athletes</Link>
              {user ? (
                <>
                  <Link to="/sessions" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>My Sessions</Link>
                  <Link to="/sessions/log" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Log Session</Link>
                  <Link to={`/athlete/${user.username}`} className="text-sm text-[#c084fc] hover:text-[#d4a5ff] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{user.username}</Link>
                  <button onClick={logout} className="text-sm text-white/40 hover:text-red-400 transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Logout</button>
                </>
              ) : (
                <Link to="/login" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Log In</Link>
              )}
              <Link to="/" className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Search Spots</Link>
            </div>

            {/* Hamburger button (mobile) */}
            <button
              ref={hamburgerRef}
              onClick={() => setMenuOpen(prev => !prev)}
              className="sm:hidden p-1 text-white/70 hover:text-white transition-colors"
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
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-[#0a1628]/80 backdrop-blur-md border-t border-white/10 px-4 sm:px-6 py-4 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/70">
            <span>H-Consult Action Sports Platform</span>
            <span>Multi-source ocean data powered by StormGlass & Open-Meteo</span>
          </div>
        </footer>
      </div>
    </>
  )
}
