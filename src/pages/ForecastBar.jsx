import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import RatingBadge from '../components/RatingBadge'
import { calculateRating, metersToFeet, msToKnots } from '../utils/ratings'
import { formatDateShort } from '../utils/formatting'

export default function ForecastBar() {
  const { spotId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('graph') // 'graph' or 'table'

  useEffect(() => {
    fetch(`/api/forecast/${spotId}?days=10`)
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [spotId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#4a9eed] border-t-transparent rounded-full" />
        <span className="ml-3 text-[#7eb8e0]">Loading forecast...</span>
      </div>
    )
  }

  // Group hourly data by day
  const days = groupByDay(data)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#4a6a8a] mb-4">
        <Link to="/" className="hover:text-[#4a9eed]">Search</Link>
        <span>/</span>
        <Link to={`/spot/${spotId}`} className="hover:text-[#4a9eed]">{data?.spot?.name}</Link>
        <span>/</span>
        <span className="text-[#7eb8e0]">Forecast</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{data?.spot?.name} — 10-Day Forecast</h1>

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('graph')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'graph' ? 'bg-[#1976D2] text-white' : 'bg-[#112240] text-[#7eb8e0] border border-[#1e3a5f]'
          }`}
        >
          Bar View
        </button>
        <button
          onClick={() => setView('table')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'table' ? 'bg-[#1976D2] text-white' : 'bg-[#112240] text-[#7eb8e0] border border-[#1e3a5f]'
          }`}
        >
          Table View
        </button>
      </div>

      {view === 'graph' ? (
        /* Horizontal scrollable day bar */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {days.map((day, i) => (
            <Link
              key={i}
              to={`/spot/${spotId}/forecast/${i}`}
              className={`flex-shrink-0 w-32 bg-[#112240] border rounded-lg p-4 hover:border-[#4a9eed] transition-all text-center ${
                i === 0 ? 'border-[#4a9eed]' : 'border-[#1e3a5f]'
              }`}
            >
              <p className="text-xs text-[#4a6a8a] mb-2">
                {i === 0 ? <span className="text-[#4a9eed] font-semibold">Today</span> : day.dateLabel}
              </p>
              <div className="mb-2">
                <RatingBadge level={day.rating.level} label={day.rating.label} color={day.rating.color} size="sm" />
              </div>
              <p className="text-lg font-bold text-white">{day.waveRange}</p>
              <p className="text-xs text-[#4a6a8a] mt-1">{day.windLabel}</p>
            </Link>
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#4a6a8a] text-xs uppercase">
                <th className="text-left py-2 px-3">Day</th>
                <th className="text-left py-2 px-3">Rating</th>
                <th className="text-left py-2 px-3">Surf</th>
                <th className="text-left py-2 px-3">Swell</th>
                <th className="text-left py-2 px-3">Wind</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, i) => (
                <tr key={i} className="border-t border-[#1e3a5f] hover:bg-[#112240]">
                  <td className="py-3 px-3">
                    <Link to={`/spot/${spotId}/forecast/${i}`} className="text-white hover:text-[#4a9eed]">
                      {day.dateLabel}
                    </Link>
                  </td>
                  <td className="py-3 px-3">
                    <RatingBadge level={day.rating.level} label={day.rating.label} color={day.rating.color} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-white">{day.waveRange}</td>
                  <td className="py-3 px-3 text-[#7eb8e0]">{day.swellLabel}</td>
                  <td className="py-3 px-3 text-[#7eb8e0]">{day.windLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Group hourly forecast data into daily summaries */
function groupByDay(data) {
  if (!data) return []

  let hours = []

  if (data.source === 'stormglass' && data.data?.hours) {
    hours = data.data.hours.map((h) => ({
      time: h.time,
      waveHeight: h.waveHeight?.sg ?? h.waveHeight?.noaa ?? 0,
      swellHeight: h.swellHeight?.sg ?? h.swellHeight?.noaa ?? 0,
      swellPeriod: h.swellPeriod?.sg ?? h.swellPeriod?.noaa ?? 0,
      swellDir: h.swellDirection?.sg ?? h.swellDirection?.noaa ?? 0,
      windSpeed: h.windSpeed?.sg ?? h.windSpeed?.noaa ?? 0,
      windDir: h.windDirection?.sg ?? h.windDirection?.noaa ?? 0,
    }))
  } else if (data.marine?.hourly) {
    const m = data.marine.hourly
    const w = data.weather?.hourly || {}
    hours = (m.time || []).map((t, i) => ({
      time: t,
      waveHeight: m.wave_height?.[i] ?? 0,
      swellHeight: m.swell_wave_height?.[i] ?? 0,
      swellPeriod: m.wave_period?.[i] ?? 0,
      swellDir: m.swell_wave_direction?.[i] ?? 0,
      windSpeed: w.wind_speed_10m?.[i] ?? 0,
      windDir: w.wind_direction_10m?.[i] ?? 0,
    }))
  }

  // Group by date
  const dayMap = {}
  hours.forEach((h) => {
    const dateKey = h.time.slice(0, 10)
    if (!dayMap[dateKey]) dayMap[dateKey] = []
    dayMap[dateKey].push(h)
  })

  return Object.entries(dayMap).map(([dateKey, dayHours]) => {
    const waves = dayHours.map((h) => metersToFeet(h.waveHeight))
    const minWave = Math.min(...waves)
    const maxWave = Math.max(...waves)
    const avgWave = waves.reduce((a, b) => a + b, 0) / waves.length

    const avgSwell = dayHours.reduce((a, h) => a + h.swellHeight, 0) / dayHours.length
    const avgPeriod = dayHours.reduce((a, h) => a + h.swellPeriod, 0) / dayHours.length
    const avgSwellDir = dayHours[Math.floor(dayHours.length / 2)].swellDir
    const avgWind = dayHours.reduce((a, h) => a + h.windSpeed, 0) / dayHours.length
    const avgWindDir = dayHours[Math.floor(dayHours.length / 2)].windDir

    const rating = calculateRating(avgWave, msToKnots(avgWind), avgWindDir, avgSwellDir, avgPeriod)

    return {
      dateKey,
      dateLabel: formatDateShort(dateKey + 'T12:00:00'),
      waveRange: `${minWave.toFixed(0)}-${maxWave.toFixed(0)} ft`,
      swellLabel: `${metersToFeet(avgSwell).toFixed(0)} ft @ ${avgPeriod.toFixed(0)}s`,
      windLabel: `${msToKnots(avgWind).toFixed(0)} kts`,
      rating,
      hours: dayHours,
    }
  })
}
