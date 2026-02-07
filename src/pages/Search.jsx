import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import spots from '../data/spots'

export default function Search() {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(-1)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const filtered = query.length > 0
    ? spots.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.region.toLowerCase().includes(query.toLowerCase()) ||
          s.subregion.toLowerCase().includes(query.toLowerCase())
      )
    : []

  // Reset active index when results change
  useEffect(() => { setActiveIdx(-1) }, [query])

  function handleKeyDown(e) {
    if (filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      navigate(`/spot/${filtered[activeIdx].id}`)
    }
  }

  return (
    <div className="flex flex-col items-center -mx-4 sm:-mx-6 -mt-6">
      {/* Hero */}
      <div className="relative w-full px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28 flex flex-col items-center">

        <div className="relative z-10 text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
            Ocean Conditions<br className="sm:hidden" /> Intelligence
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-md mx-auto drop-shadow-md">
            Multi-source ocean forecasts with confidence scoring.
            See where the data agrees — and where it doesn't.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full max-w-xl z-10">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7eb8e0]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search a surf spot..."
            className="w-full pl-12 pr-5 py-4 rounded-xl bg-[#112240]/90 backdrop-blur-sm border border-[#1e3a5f] text-white text-lg placeholder-[#7eb8e0]/50 focus:outline-none focus:border-[#4a9eed] focus:ring-1 focus:ring-[#4a9eed] transition-all shadow-xl"
            autoFocus
          />

          {/* Autocomplete dropdown */}
          {filtered.length > 0 && (
            <ul ref={listRef} className="absolute top-full left-0 right-0 mt-1 bg-[#112240]/95 backdrop-blur-sm border border-[#1e3a5f] rounded-xl overflow-hidden shadow-2xl z-10 max-h-80 overflow-y-auto">
              {filtered.map((spot, i) => (
                <li key={spot.id}>
                  <button
                    onClick={() => navigate(`/spot/${spot.id}`)}
                    className={`w-full text-left px-5 py-3 transition-colors flex justify-between items-center ${
                      i === activeIdx ? 'bg-[#1e3a5f]' : 'hover:bg-[#1e3a5f]/50'
                    }`}
                  >
                    <div>
                      <span className="text-white font-medium">{spot.name}</span>
                      <span className="text-white/50 text-xs ml-2">{spot.subregion}</span>
                    </div>
                    <span className="text-white/50 text-sm">{spot.region}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* No results */}
          {query.length > 2 && filtered.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#112240]/95 backdrop-blur-sm border border-[#1e3a5f] rounded-xl px-5 py-4 text-white/50 text-sm">
              No spots found for "{query}"
            </div>
          )}
        </div>
      </div>

      {/* Popular spots — below the hero */}
      <div className="w-full max-w-xl px-4 sm:px-0 mt-10 mb-8">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          Popular Spots — California Coast
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {spots.slice(0, 8).map((spot) => (
            <button
              key={spot.id}
              onClick={() => navigate(`/spot/${spot.id}`)}
              className="text-left px-4 py-3 bg-[#112240] border border-[#1e3a5f] rounded-lg hover:border-[#4a9eed] hover:bg-[#112240]/80 transition-all group"
            >
              <span className="text-white text-sm font-medium block group-hover:text-[#4a9eed] transition-colors">
                {spot.name}
              </span>
              <span className="text-white/50 text-xs">{spot.region} / {spot.subregion}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
