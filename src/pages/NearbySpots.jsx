import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import RatingBadge from '../components/RatingBadge'
import { calculateRating, metersToFeet, msToKnots } from '../utils/ratings'
import spots from '../data/spots'

export default function NearbySpots() {
  const { spotId } = useParams()
  const [nearbyData, setNearbyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('distance') // 'distance', 'rating', 'wind'

  const currentSpot = spots.find((s) => s.id === spotId)

  useEffect(() => {
    if (!currentSpot) return

    // Find the 8 nearest spots (excluding current)
    const nearby = spots
      .filter((s) => s.id !== spotId)
      .map((s) => ({
        ...s,
        distance: haversine(currentSpot.lat, currentSpot.lng, s.lat, s.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8)

    // Fetch conditions for each nearby spot
    Promise.all(
      nearby.map((s) =>
        fetch(`/api/conditions/${s.id}`)
          .then((res) => res.json())
          .then((data) => ({ ...s, conditions: data }))
          .catch(() => ({ ...s, conditions: null }))
      )
    ).then((results) => {
      setNearbyData(results.map(parseNearbySpot))
      setLoading(false)
    })
  }, [spotId])

  if (!currentSpot) {
    return <div className="text-center py-20 text-[#4a6a8a]">Spot not found.</div>
  }

  const sorted = [...nearbyData].sort((a, b) => {
    if (sortBy === 'rating') return b.ratingLevel - a.ratingLevel
    if (sortBy === 'wind') return a.windSpeed - b.windSpeed
    return a.distance - b.distance
  })

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#4a6a8a] mb-4">
        <Link to="/" className="hover:text-[#4a9eed]">Search</Link>
        <span>/</span>
        <Link to={`/spot/${spotId}`} className="hover:text-[#4a9eed]">{currentSpot.name}</Link>
        <span>/</span>
        <span className="text-[#7eb8e0]">Nearby Spots</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Nearby Spots</h1>

      {/* Map */}
      <div className="mb-6 rounded-lg overflow-hidden border border-[#1e3a5f]">
        <MapContainer
          center={[currentSpot.lat, currentSpot.lng]}
          zoom={9}
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <Marker position={[currentSpot.lat, currentSpot.lng]}>
            <Popup>{currentSpot.name} (current)</Popup>
          </Marker>
          {nearbyData.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]}>
              <Popup>
                <strong>{s.name}</strong><br />
                {s.waveLabel} — {s.ratingLabel}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Sort controls */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'distance', label: 'Closest' },
          { key: 'rating', label: 'Best Conditions' },
          { key: 'wind', label: 'Lightest Wind' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortBy === opt.key ? 'bg-[#1976D2] text-white' : 'bg-[#112240] text-[#7eb8e0] border border-[#1e3a5f]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Comparison table */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-[#4a9eed] border-t-transparent rounded-full" />
          <span className="ml-3 text-[#7eb8e0]">Loading nearby conditions...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#4a6a8a] text-xs uppercase">
                <th className="text-left py-2 px-3">Spot</th>
                <th className="text-left py-2 px-3">Distance</th>
                <th className="text-left py-2 px-3">Rating</th>
                <th className="text-left py-2 px-3">Surf</th>
                <th className="text-left py-2 px-3">Wind</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} className="border-t border-[#1e3a5f] hover:bg-[#112240]">
                  <td className="py-3 px-3">
                    <Link to={`/spot/${s.id}`} className="text-white hover:text-[#4a9eed] font-medium">
                      {s.name}
                    </Link>
                    <p className="text-xs text-[#4a6a8a]">{s.region}</p>
                  </td>
                  <td className="py-3 px-3 text-[#7eb8e0]">{s.distance.toFixed(1)} mi</td>
                  <td className="py-3 px-3">
                    <RatingBadge level={s.ratingLevel} label={s.ratingLabel} color={s.ratingColor} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-white">{s.waveLabel}</td>
                  <td className="py-3 px-3 text-[#7eb8e0]">{s.windLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Haversine distance in miles */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Parse conditions data into display fields for a nearby spot */
function parseNearbySpot(spot) {
  let waveHeight = 0, windSpeed = 0, windDir = 0, swellDir = 0, swellPeriod = 0

  if (spot.conditions?.source === 'stormglass' && spot.conditions.data?.hours?.[0]) {
    const h = spot.conditions.data.hours[0]
    waveHeight = h.waveHeight?.sg ?? h.waveHeight?.noaa ?? 0
    windSpeed = h.windSpeed?.sg ?? h.windSpeed?.noaa ?? 0
    windDir = h.windDirection?.sg ?? h.windDirection?.noaa ?? 0
    swellDir = h.swellDirection?.sg ?? h.swellDirection?.noaa ?? 0
    swellPeriod = h.swellPeriod?.sg ?? h.swellPeriod?.noaa ?? 0
  } else if (spot.conditions?.marine?.hourly) {
    waveHeight = spot.conditions.marine.hourly.wave_height?.[0] ?? 0
    windSpeed = spot.conditions.weather?.current?.wind_speed_10m ?? 0
    windDir = spot.conditions.weather?.current?.wind_direction_10m ?? 0
  }

  const waveHeightFt = metersToFeet(waveHeight)
  const windKnots = msToKnots(windSpeed)
  const rating = calculateRating(waveHeightFt, windKnots, windDir, swellDir, swellPeriod)

  return {
    ...spot,
    waveLabel: `${waveHeightFt.toFixed(1)} ft`,
    windLabel: `${windKnots.toFixed(0)} kts`,
    windSpeed: windKnots,
    ratingLevel: rating.level,
    ratingLabel: rating.label,
    ratingColor: rating.color,
  }
}
