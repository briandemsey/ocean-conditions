import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ConditionCard from '../components/ConditionCard'
import RatingBadge from '../components/RatingBadge'
import { calculateRating, metersToFeet, msToKnots } from '../utils/ratings'
import { useAuth } from '../context/AuthContext'
import { degreesToCompass, formatTemp, formatWind, formatTime, cToF } from '../utils/formatting'

export default function SpotOverview() {
  const { spotId } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [spotLeaderboard, setSpotLeaderboard] = useState([])
  const [spotLbPeriod, setSpotLbPeriod] = useState('all')
  const [spotLbLoading, setSpotLbLoading] = useState(true)

  function loadConditions() {
    setLoading(true)
    setError(null)
    fetch(`/api/conditions/${spotId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`)
        return res.json()
      })
      .then((d) => {
        setData(d)
        setFetchedAt(new Date())
        setLoading(false)
      })
      .catch((err) => { setError(err.message); setLoading(false) })
  }

  useEffect(() => { loadConditions() }, [spotId])

  useEffect(() => {
    setSpotLbLoading(true)
    fetch(`/api/leaderboards/spot/${spotId}?period=${spotLbPeriod}`)
      .then((res) => res.json())
      .then((d) => { setSpotLeaderboard(d); setSpotLbLoading(false) })
      .catch(() => { setSpotLeaderboard([]); setSpotLbLoading(false) })
  }, [spotId, spotLbPeriod])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="loading-shimmer h-8 w-48" />
        <div className="loading-shimmer h-12 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        <p className="text-red-400 mb-4">Failed to load conditions: {error}</p>
        <button
          onClick={loadConditions}
          className="px-5 py-2.5 bg-[#1976D2] text-white rounded-lg font-medium hover:bg-[#1565C0] transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  // Parse conditions depending on data source
  let waveHeight, swellHeight, swellPeriod, swellDir, windSpeed, windDir, windGust
  let waterTemp, airTemp, source

  if (data.source === 'stormglass' && data.data?.hours?.[0]) {
    const h = data.data.hours[0]
    waveHeight = h.waveHeight?.sg ?? h.waveHeight?.noaa
    swellHeight = h.swellHeight?.sg ?? h.swellHeight?.noaa
    swellPeriod = h.swellPeriod?.sg ?? h.swellPeriod?.noaa
    swellDir = h.swellDirection?.sg ?? h.swellDirection?.noaa
    windSpeed = h.windSpeed?.sg ?? h.windSpeed?.noaa
    windDir = h.windDirection?.sg ?? h.windDirection?.noaa
    windGust = h.gust?.sg ?? h.gust?.noaa
    waterTemp = h.waterTemperature?.sg ?? h.waterTemperature?.noaa
    airTemp = h.airTemperature?.sg ?? h.airTemperature?.noaa
    source = 'StormGlass'
  } else {
    // Open-Meteo fallback — find the closest hour to now
    const now = Date.now()
    let mIdx = 0
    if (data.marine?.hourly?.time) {
      let closest = Infinity
      data.marine.hourly.time.forEach((t, i) => {
        const diff = Math.abs(new Date(t).getTime() - now)
        if (diff < closest) { closest = diff; mIdx = i }
      })
    }
    if (data.marine?.hourly) {
      waveHeight = data.marine.hourly.wave_height?.[mIdx]
      swellHeight = data.marine.hourly.swell_wave_height?.[mIdx]
      swellPeriod = data.marine.hourly.wave_period?.[mIdx]
      swellDir = data.marine.hourly.swell_wave_direction?.[mIdx]
    }
    if (data.weather?.current) {
      windSpeed = data.weather.current.wind_speed_10m
      windDir = data.weather.current.wind_direction_10m
      airTemp = data.weather.current.temperature_2m
    }
    source = 'Open-Meteo'
  }

  const waveHeightFt = waveHeight != null ? metersToFeet(waveHeight) : 0
  const swellHeightFt = swellHeight != null ? metersToFeet(swellHeight) : null
  const windKnots = windSpeed != null ? msToKnots(windSpeed) : null
  const gustKnots = windGust != null ? msToKnots(windGust) : null
  const rating = calculateRating(waveHeightFt, windKnots, windDir, swellDir, swellPeriod)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/70 mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <Link to="/" className="hover:text-[#4a9eed] transition-colors">Search</Link>
        <span>/</span>
        <span className="text-white">{data.spot?.name}</span>
      </div>

      {/* Spot header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 min-w-0">
        <div className="min-w-0" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{data.spot?.name}</h1>
          <p className="text-white/70">
            {data.spot?.region}
            {fetchedAt && (
              <span className="ml-3 text-xs text-white/60">
                Updated {formatTime(fetchedAt.toISOString())}
              </span>
            )}
          </p>
        </div>
        <RatingBadge level={rating.level} label={rating.label} color={rating.color} size="lg" />
      </div>

      {/* Condition cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <ConditionCard
          title="Surf"
          value={`${waveHeightFt.toFixed(1)} ft`}
          subtitle={`Rating: ${rating.label}`}
          accentColor={rating.color}
        />
        <ConditionCard
          title="Swell"
          value={swellHeightFt ? `${swellHeightFt.toFixed(1)} ft` : '--'}
          subtitle={`${swellPeriod ? swellPeriod.toFixed(0) + 's' : '--'} @ ${degreesToCompass(swellDir)}`}
        />
        <ConditionCard
          title="Wind"
          value={formatWind(windKnots, gustKnots)}
          subtitle={degreesToCompass(windDir)}
        />
        <ConditionCard
          title="Water Temp"
          value={waterTemp != null ? formatTemp(cToF(waterTemp)) : '--'}
        />
        <ConditionCard
          title="Air Temp"
          value={airTemp != null ? formatTemp(cToF(airTemp)) : '--'}
        />
        <ConditionCard
          title="Data Source"
          value={source}
          subtitle={data.source.includes('fallback') ? 'Primary unavailable' : 'Live'}
        />
      </div>

      {/* Spot Guide */}
      {data.spot?.breakType && (
        <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4 sm:p-6 mb-8">
          <h2 className="text-[10px] sm:text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">Spot Guide</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 mb-5">
            <div>
              <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Break Type</span>
              <p className="text-sm sm:text-base font-semibold text-white capitalize">{data.spot.breakType}</p>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Difficulty</span>
              <p className="text-sm sm:text-base font-semibold text-white capitalize">{data.spot.difficulty}</p>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Best Tide</span>
              <p className="text-sm sm:text-base font-semibold text-white capitalize">{data.spot.bestTide}</p>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Best Swell</span>
              <p className="text-sm sm:text-base font-semibold text-white">{data.spot.optimalSwell}</p>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Best Wind</span>
              <p className="text-sm sm:text-base font-semibold text-white">{data.spot.optimalWind}</p>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Season</span>
              <p className="text-sm sm:text-base font-semibold text-white capitalize">{data.spot.bestSeason}</p>
            </div>
          </div>
          {data.spot.hazards?.length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mr-2">Hazards</span>
              <div className="mt-1.5">
                {data.spot.hazards.map((h) => (
                  <span key={h} className="inline-block px-2 py-0.5 bg-[#0d1f3c] border border-[#1e3a5f] rounded text-xs text-[#7eb8e0] mr-1.5 mb-1.5">{h}</span>
                ))}
              </div>
            </div>
          )}
          {data.spot.description && (
            <p className="text-white/80 text-sm mb-3">{data.spot.description}</p>
          )}
          {data.spot.tips && (
            <p className="text-white/60 text-sm italic">Tip: {data.spot.tips}</p>
          )}
        </div>
      )}

      {/* Top Surfers Here */}
      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4 sm:p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] sm:text-xs font-semibold text-white/60 uppercase tracking-wider">Top Surfers Here</h2>
          <div className="flex rounded-md overflow-hidden border border-[#1e3a5f]">
            <button
              onClick={() => setSpotLbPeriod('all')}
              className={`px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-colors ${
                spotLbPeriod === 'all' ? 'bg-[#1976D2] text-white' : 'bg-[#0d1f3c] text-white/50 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setSpotLbPeriod('month')}
              className={`px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-colors ${
                spotLbPeriod === 'month' ? 'bg-[#1976D2] text-white' : 'bg-[#0d1f3c] text-white/50 hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
        {spotLbLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="loading-shimmer h-6 w-full" />)}
          </div>
        ) : spotLeaderboard.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-3">No sessions logged here yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50 text-[10px] sm:text-xs uppercase tracking-wider">
                <th className="text-left pb-2 w-8">#</th>
                <th className="text-left pb-2">Surfer</th>
                <th className="text-right pb-2">Sessions</th>
                <th className="text-right pb-2 hidden sm:table-cell">Waves</th>
                <th className="text-right pb-2 hidden sm:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {spotLeaderboard.map((r) => (
                <tr key={r.username} className="border-t border-white/5">
                  <td className="py-2 text-white/50">{r.rank}</td>
                  <td className="py-2">
                    <Link to={`/athlete/${r.username}`} className="text-[#4a9eed] hover:text-[#7eb8e0] transition-colors">
                      {r.username}
                    </Link>
                  </td>
                  <td className="py-2 text-right text-white font-medium">{r.sessions}</td>
                  <td className="py-2 text-right text-white/70 hidden sm:table-cell">{r.waves}</td>
                  <td className="py-2 text-right text-white/70 hidden sm:table-cell">{r.total_time_formatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Navigation to other screens */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <Link
          to={`/spot/${spotId}/forecast`}
          className="px-5 py-3 bg-[#1976D2] text-white rounded-lg font-medium hover:bg-[#1565C0] transition-colors text-center"
        >
          View 10-Day Forecast
        </Link>
        <Link
          to={`/spot/${spotId}/compare`}
          className="px-5 py-3 bg-[#112240] border border-[#1e3a5f] text-white rounded-lg font-medium hover:border-[#4a9eed] transition-colors text-center"
        >
          Multi-Source Comparison
        </Link>
        <Link
          to={`/spot/${spotId}/nearby`}
          className="px-5 py-3 bg-[#112240] border border-[#1e3a5f] text-white rounded-lg font-medium hover:border-[#4a9eed] transition-colors text-center"
        >
          Nearby Spots
        </Link>
        {user ? (
          <Link
            to={`/sessions/log/${spotId}`}
            className="px-5 py-3 bg-[#112240] border border-[#1e3a5f] text-white rounded-lg font-medium hover:border-[#4a9eed] transition-colors text-center"
          >
            Log Session
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-5 py-3 bg-[#112240] border border-[#1e3a5f] text-white rounded-lg font-medium hover:border-[#4a9eed] transition-colors text-center"
          >
            Log In to Log Session
          </Link>
        )}
        {data.spot?.surflineUrl && (
          <a
            href={data.spot.surflineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-[#112240] border border-[#1e3a5f] text-white rounded-lg font-medium hover:border-[#4a9eed] transition-colors text-center"
          >
            View on Surfline
          </a>
        )}
      </div>
    </div>
  )
}
