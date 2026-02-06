import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import AgreementScore from '../components/AgreementScore'
import { metersToFeet } from '../utils/ratings'

const SOURCE_COLORS = {
  sg: { name: 'StormGlass AI', color: '#4a9eed' },
  noaa: { name: 'NOAA', color: '#689F38' },
  dwd: { name: 'DWD (Germany)', color: '#FBC02D' },
  meteo: { name: 'MeteoFrance', color: '#F57C00' },
  meto: { name: 'UK MetOffice', color: '#D32F2F' },
}

export default function MultiSource() {
  const { spotId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/compare/${spotId}`)
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [spotId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#4a9eed] border-t-transparent rounded-full" />
        <span className="ml-3 text-[#7eb8e0]">Loading multi-source data...</span>
      </div>
    )
  }

  if (!data || data.source === 'none') {
    return (
      <div className="text-center py-20">
        <p className="text-[#4a6a8a] mb-2">Multi-source comparison requires a StormGlass API key.</p>
        <p className="text-[#7eb8e0] text-sm">Add STORMGLASS_API_KEY to your .env file.</p>
      </div>
    )
  }

  const { chartData, activeSources, agreementSources } = buildMultiSourceData(data)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#4a6a8a] mb-4">
        <Link to="/" className="hover:text-[#4a9eed]">Search</Link>
        <span>/</span>
        <Link to={`/spot/${spotId}`} className="hover:text-[#4a9eed]">{data?.spot?.name}</Link>
        <span>/</span>
        <span className="text-[#7eb8e0]">Multi-Source Comparison</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{data?.spot?.name} — Source Comparison</h1>
      <p className="text-sm sm:text-base text-[#7eb8e0] mb-6">
        See where forecasts agree and diverge — this is what Surfline can't show you.
      </p>

      {/* Agreement Score */}
      {agreementSources.length > 0 && (
        <div className="mb-6">
          <AgreementScore sources={agreementSources} field="waveHeight" />
        </div>
      )}

      {/* Wave Height Comparison */}
      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4 mb-4">
        <h2 className="text-sm font-semibold text-[#4a6a8a] uppercase tracking-wider mb-3">
          Wave Height by Source (ft)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="time" stroke="#4a6a8a" tick={{ fontSize: 10 }} />
            <YAxis stroke="#4a6a8a" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid #1e3a5f', borderRadius: 8 }}
              labelStyle={{ color: '#7eb8e0' }}
            />
            <Legend />
            {activeSources.map((src) => (
              <Line
                key={src}
                type="monotone"
                dataKey={`wave_${src}`}
                name={SOURCE_COLORS[src]?.name || src}
                stroke={SOURCE_COLORS[src]?.color || '#fff'}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Wind Speed Comparison */}
      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4 mb-4">
        <h2 className="text-sm font-semibold text-[#4a6a8a] uppercase tracking-wider mb-3">
          Wind Speed by Source (m/s)
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="time" stroke="#4a6a8a" tick={{ fontSize: 10 }} />
            <YAxis stroke="#4a6a8a" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid #1e3a5f', borderRadius: 8 }}
              labelStyle={{ color: '#7eb8e0' }}
            />
            <Legend />
            {activeSources.map((src) => (
              <Line
                key={src}
                type="monotone"
                dataKey={`wind_${src}`}
                name={SOURCE_COLORS[src]?.name || src}
                stroke={SOURCE_COLORS[src]?.color || '#fff'}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Source legend */}
      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4">
        <h2 className="text-sm font-semibold text-[#4a6a8a] uppercase tracking-wider mb-3">
          Data Sources
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {activeSources.map((src) => (
            <div key={src} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SOURCE_COLORS[src]?.color }} />
              <span className="text-sm text-white">{SOURCE_COLORS[src]?.name || src}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function buildMultiSourceData(data) {
  if (!data?.data?.hours) return { chartData: [], activeSources: [], agreementSources: [] }

  const allSources = ['sg', 'noaa', 'dwd', 'meteo', 'meto']

  // Determine which sources have data
  const activeSources = allSources.filter((src) =>
    data.data.hours.some((h) => h.waveHeight?.[src] != null)
  )

  const chartData = data.data.hours.map((h) => {
    const point = {
      time: new Date(h.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, month: 'short', day: 'numeric' }),
    }
    activeSources.forEach((src) => {
      point[`wave_${src}`] = h.waveHeight?.[src] != null ? parseFloat(metersToFeet(h.waveHeight[src]).toFixed(1)) : null
      point[`wind_${src}`] = h.windSpeed?.[src] != null ? parseFloat(h.windSpeed[src].toFixed(1)) : null
    })
    return point
  })

  // Build agreement sources from first hour
  const firstHour = data.data.hours[0]
  const agreementSources = activeSources
    .filter((src) => firstHour?.waveHeight?.[src] != null)
    .map((src) => ({ source: src, waveHeight: firstHour.waveHeight[src] }))

  return { chartData, activeSources, agreementSources }
}
