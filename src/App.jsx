import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Search from './pages/Search'
import SpotOverview from './pages/SpotOverview'
import ForecastBar from './pages/ForecastBar'
import ForecastDetail from './pages/ForecastDetail'
import MultiSource from './pages/MultiSource'
import NearbySpots from './pages/NearbySpots'

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'

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
      <div className="fixed inset-0 -z-10 bg-[#0a1628]/40" />

      <div className="min-h-screen flex flex-col relative">
        {/* Nav bar — no background, just a subtle blur */}
        <nav className="backdrop-blur-sm border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1976D2] to-[#7B1FA2] flex items-center justify-center text-white font-bold text-sm">
              OC
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">Ocean Conditions</span>
              <span className="text-xs text-[#4a9eed] font-medium tracking-wide uppercase ml-2 hidden sm:inline">
                Intelligence
              </span>
            </div>
          </Link>
          {!isHome && (
            <Link
              to="/"
              className="text-sm text-white/60 hover:text-[#4a9eed] transition-colors"
            >
              Search Spots
            </Link>
          )}
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
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 px-4 sm:px-6 py-4 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
            <span>H-Consult Action Sports Platform</span>
            <span>Multi-source ocean data powered by StormGlass & Open-Meteo</span>
          </div>
        </footer>
      </div>
    </>
  )
}
