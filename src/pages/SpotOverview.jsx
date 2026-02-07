import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ConditionCard from '../components/ConditionCard'
import RatingBadge from '../components/RatingBadge'
import { calculateRating, metersToFeet, msToKnots } from '../utils/ratings'
import { degreesToCompass, formatTemp, formatWind, formatTime, cToF } from '../utils/formatting'

export default function SpotOverview() {
  const { spotId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

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
      </div>
    </div>
  )
}
