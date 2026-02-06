import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ConditionCard from '../components/ConditionCard'
import RatingBadge from '../components/RatingBadge'
import { calculateRating, metersToFeet, msToKnots } from '../utils/ratings'
import { degreesToCompass, formatTemp, formatWind, cToF } from '../utils/formatting'

export default function SpotOverview() {
  const { spotId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/conditions/${spotId}`)
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [spotId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#4a9eed] border-t-transparent rounded-full" />
        <span className="ml-3 text-[#7eb8e0]">Loading conditions...</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-20 text-red-400">Error: {error}</div>
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
    windGust = h.windGust?.sg ?? h.windGust?.noaa
    waterTemp = h.waterTemperature?.sg ?? h.waterTemperature?.noaa
    airTemp = h.airTemperature?.sg ?? h.airTemperature?.noaa
    source = 'StormGlass'
  } else {
    // Open-Meteo fallback
    const mIdx = 0 // current hour index
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
      <div className="flex items-center gap-2 text-sm text-[#4a6a8a] mb-4">
        <Link to="/" className="hover:text-[#4a9eed]">Search</Link>
        <span>/</span>
        <span className="text-[#7eb8e0]">{data.spot?.name}</span>
      </div>

      {/* Spot header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{data.spot?.name}</h1>
          <p className="text-[#4a6a8a]">{data.spot?.region}</p>
        </div>
        <RatingBadge level={rating.level} label={rating.label} color={rating.color} size="lg" />
      </div>

      {/* Condition cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <ConditionCard
          title="Surf"
          value={`${waveHeightFt.toFixed(1)} ft`}
          subtitle={`Rating: ${rating.label}`}
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
          subtitle={data.source.includes('fallback') ? 'Primary API unavailable' : 'Live data'}
        />
      </div>

      {/* Navigation to other screens */}
      <div className="flex flex-wrap gap-3">
        <Link
          to={`/spot/${spotId}/forecast`}
          className="px-5 py-2.5 bg-[#1976D2] text-white rounded-lg font-medium hover:bg-[#1565C0] transition-colors"
        >
          View Forecast
        </Link>
        <Link
          to={`/spot/${spotId}/compare`}
          className="px-5 py-2.5 bg-[#112240] border border-[#1e3a5f] text-white rounded-lg font-medium hover:border-[#4a9eed] transition-colors"
        >
          Multi-Source Comparison
        </Link>
        <Link
          to={`/spot/${spotId}/nearby`}
          className="px-5 py-2.5 bg-[#112240] border border-[#1e3a5f] text-white rounded-lg font-medium hover:border-[#4a9eed] transition-colors"
        >
          Nearby Spots
        </Link>
      </div>
    </div>
  )
}
