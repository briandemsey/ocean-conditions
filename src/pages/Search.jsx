import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import spots from '../data/spots'

export default function Search() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = query.length > 0
    ? spots.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.region.toLowerCase().includes(query.toLowerCase()) ||
          s.subregion.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <div className="flex flex-col items-center pt-20">
      {/* Hero */}
      <h1 className="text-4xl font-bold text-white mb-2">Ocean Conditions Intelligence</h1>
      <p className="text-[#7eb8e0] mb-10 text-lg">
        Multi-source ocean forecasts with confidence scoring
      </p>

      {/* Search input */}
      <div className="relative w-full max-w-xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a surf spot — try Huntington Beach..."
          className="w-full px-5 py-4 rounded-xl bg-[#112240] border border-[#1e3a5f] text-white text-lg placeholder-[#4a6a8a] focus:outline-none focus:border-[#4a9eed] focus:ring-1 focus:ring-[#4a9eed] transition-colors"
          autoFocus
        />

        {/* Autocomplete dropdown */}
        {filtered.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 bg-[#112240] border border-[#1e3a5f] rounded-xl overflow-hidden shadow-2xl z-10">
            {filtered.map((spot) => (
              <li key={spot.id}>
                <button
                  onClick={() => navigate(`/spot/${spot.id}`)}
                  className="w-full text-left px-5 py-3 hover:bg-[#1e3a5f] transition-colors flex justify-between items-center"
                >
                  <span className="text-white font-medium">{spot.name}</span>
                  <span className="text-[#4a6a8a] text-sm">{spot.region}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Popular spots */}
      <div className="mt-16 w-full max-w-xl">
        <h2 className="text-sm font-semibold text-[#4a6a8a] uppercase tracking-wider mb-4">
          Popular Spots
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {spots.slice(0, 6).map((spot) => (
            <button
              key={spot.id}
              onClick={() => navigate(`/spot/${spot.id}`)}
              className="text-left px-4 py-3 bg-[#112240] border border-[#1e3a5f] rounded-lg hover:border-[#4a9eed] transition-colors"
            >
              <span className="text-white text-sm font-medium block">{spot.name}</span>
              <span className="text-[#4a6a8a] text-xs">{spot.region}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
