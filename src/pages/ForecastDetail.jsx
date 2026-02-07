import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  BarChart, Bar, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { calculateRating, metersToFeet, msToKnots, getRatingByLevel } from '../utils/ratings'
import { formatDateShort, degreesToCompass } from '../utils/formatting'

export default function ForecastDetail() {
  const { spotId, day } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

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
        <span className="ml-3 text-[#7eb8e0]">Loading forecast detail...</span>
      </div>
    )
  }

  const dayIdx = parseInt(day) || 0
  const chartData = buildChartData(data, dayIdx)

  if (!chartData || chartData.length === 0) {
    return <div className="text-center py-20 text-white/60">No data for this day.</div>
  }

  const dateLabel = formatDateShort(chartData[0]?.time)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
        <Link to="/" className="hover:text-[#4a9eed]">Search</Link>
        <span>/</span>
        <Link to={`/spot/${spotId}`} className="hover:text-[#4a9eed]">{data?.spot?.name}</Link>
        <span>/</span>
        <Link to={`/spot/${spotId}/forecast`} className="hover:text-[#4a9eed]">Forecast</Link>
        <span>/</span>
        <span className="text-[#7eb8e0]">{dateLabel}</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6">
        {data?.spot?.name} — {dateLabel}
      </h1>

      {/* Surf Height Chart — bars colored by rating */}
      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-3 sm:p-4 mb-4">
        <h2 className="text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Surf Height (ft)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="hour" stroke="#4a6a8a" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis stroke="#4a6a8a" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid #1e3a5f', borderRadius: 8 }}
              labelStyle={{ color: '#7eb8e0' }}
            />
            <Bar dataKey="waveHeightFt" name="Wave Height" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => {
                const r = calculateRating(entry.waveHeightFt, entry.windKnots, null, null, null)
                return <Cell key={i} fill={r.color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Swell Chart */}
      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-3 sm:p-4 mb-4">
        <h2 className="text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Swell Height (ft)
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="hour" stroke="#4a6a8a" tick={{ fontSize: 11 }} />
            <YAxis stroke="#4a6a8a" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid #1e3a5f', borderRadius: 8 }}
              labelStyle={{ color: '#7eb8e0' }}
            />
            <Line type="monotone" dataKey="swellHeightFt" name="Primary Swell" stroke="#7B1FA2" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Wind Chart */}
      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-3 sm:p-4 mb-4">
        <h2 className="text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Wind Speed (kts)
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="hour" stroke="#4a6a8a" tick={{ fontSize: 11 }} />
            <YAxis stroke="#4a6a8a" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid #1e3a5f', borderRadius: 8 }}
              labelStyle={{ color: '#7eb8e0' }}
            />
            <Area type="monotone" dataKey="windKnots" name="Wind" stroke="#689F38" fill="#689F38" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Wind Direction Labels */}
      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-3 sm:p-4 mb-4">
        <h2 className="text-xs sm:text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Wind Direction by Hour
        </h2>
        <div className="flex gap-2 overflow-x-auto">
          {chartData.map((d, i) => (
            <div key={i} className="flex-shrink-0 text-center w-12">
              <p className="text-xs text-white/60">{d.hour}</p>
              <p className="text-sm text-white font-medium">{d.windCompass}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function buildChartData(data, dayIdx) {
  if (!data) return []

  let hours = []
  if (data.source === 'stormglass' && data.data?.hours) {
    hours = data.data.hours.map((h) => ({
      time: h.time,
      waveHeight: h.waveHeight?.sg ?? h.waveHeight?.noaa ?? 0,
      swellHeight: h.swellHeight?.sg ?? h.swellHeight?.noaa ?? 0,
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
      windSpeed: w.wind_speed_10m?.[i] ?? 0,
      windDir: w.wind_direction_10m?.[i] ?? 0,
    }))
  }

  // Group by day and pick the target day
  const dayMap = {}
  hours.forEach((h) => {
    const dateKey = h.time.slice(0, 10)
    if (!dayMap[dateKey]) dayMap[dateKey] = []
    dayMap[dateKey].push(h)
  })

  const dayKeys = Object.keys(dayMap).sort()
  const targetKey = dayKeys[dayIdx]
  if (!targetKey) return []

  return dayMap[targetKey].map((h) => ({
    time: h.time,
    hour: new Date(h.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
    waveHeightFt: parseFloat(metersToFeet(h.waveHeight).toFixed(1)),
    swellHeightFt: parseFloat(metersToFeet(h.swellHeight).toFixed(1)),
    windKnots: parseFloat(msToKnots(h.windSpeed).toFixed(1)),
    windCompass: degreesToCompass(h.windDir),
  }))
}
