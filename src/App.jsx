import { Routes, Route, Link } from 'react-router-dom'
import Search from './pages/Search'
import SpotOverview from './pages/SpotOverview'
import ForecastBar from './pages/ForecastBar'
import ForecastDetail from './pages/ForecastDetail'
import MultiSource from './pages/MultiSource'
import NearbySpots from './pages/NearbySpots'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Top nav bar */}
      <nav className="bg-[#0d1f3c] border-b border-[#1e3a5f] px-4 py-3 flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-white tracking-tight">
          Ocean Conditions
        </Link>
        <span className="text-xs text-[#4a9eed] font-medium tracking-wide uppercase">
          Intelligence
        </span>
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/spot/:spotId" element={<SpotOverview />} />
          <Route path="/spot/:spotId/forecast" element={<ForecastBar />} />
          <Route path="/spot/:spotId/forecast/:day" element={<ForecastDetail />} />
          <Route path="/spot/:spotId/compare" element={<MultiSource />} />
          <Route path="/spot/:spotId/nearby" element={<NearbySpots />} />
        </Routes>
      </main>
    </div>
  )
}
