import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function LeaderboardTable({ title, rows, valueLabel, formatValue }) {
  return (
    <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4 sm:p-6">
      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-white/40 text-sm py-4 text-center">No data yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/50 text-xs uppercase tracking-wider">
              <th className="text-left pb-2 w-8">#</th>
              <th className="text-left pb-2">Surfer</th>
              <th className="text-right pb-2">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.username} className="border-t border-white/5">
                <td className="py-2 text-white/50">{row.rank}</td>
                <td className="py-2">
                  <Link to={`/athlete/${row.username}`} className="text-[#4a9eed] hover:text-[#7eb8e0] transition-colors">
                    {row.username}
                  </Link>
                </td>
                <td className="py-2 text-right text-white font-medium">{formatValue(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ShimmerTable() {
  return (
    <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4 sm:p-6">
      <div className="loading-shimmer h-4 w-32 mb-4" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="loading-shimmer h-6 w-full mb-2" />
      ))}
    </div>
  )
}

export default function Leaderboards() {
  const [period, setPeriod] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboards?period=${period}`)
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  return (
    <div>
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
          Leaderboards
        </h1>
        <div className="flex rounded-lg overflow-hidden border border-[#1e3a5f]">
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              period === 'all'
                ? 'bg-[#1976D2] text-white'
                : 'bg-[#112240] text-white/60 hover:text-white'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-[#1976D2] text-white'
                : 'bg-[#112240] text-white/60 hover:text-white'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Leaderboard tables — 2-column grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(5)].map((_, i) => <ShimmerTable key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LeaderboardTable
            title="Most Sessions"
            rows={data?.sessions || []}
            valueLabel="Sessions"
            formatValue={(r) => r.value}
          />
          <LeaderboardTable
            title="Most Waves"
            rows={data?.waves || []}
            valueLabel="Waves"
            formatValue={(r) => r.value}
          />
          <LeaderboardTable
            title="Biggest Waves"
            rows={data?.biggestWaves || []}
            valueLabel="Best Session"
            formatValue={(r) => r.value}
          />
          <LeaderboardTable
            title="Total Time"
            rows={data?.time || []}
            valueLabel="Time"
            formatValue={(r) => r.formatted}
          />
          <LeaderboardTable
            title="Avg Rating"
            rows={data?.rating || []}
            valueLabel="Rating"
            formatValue={(r) => `${r.value}/5`}
          />
        </div>
      )}
    </div>
  )
}
