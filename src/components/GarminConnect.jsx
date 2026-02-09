import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function GarminConnect({ connected, onSync }) {
  const { authHeaders } = useAuth()
  const [loading, setLoading] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/garmin', { headers: authHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start Garmin connection')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleSync() {
    setLoading(true)
    setError(null)
    setSyncResult(null)
    try {
      const res = await fetch('/api/garmin/sync', {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      setSyncResult(data)
      if (data.synced > 0 && onSync) onSync()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/garmin/disconnect', {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to disconnect')
      setSyncResult(null)
      if (onSync) onSync()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white/80">Garmin Connect</h3>
            <p className="text-xs text-white/50 mt-0.5">Auto-sync surf sessions from your Garmin watch</p>
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#007DC3' }}
          >
            {loading ? 'Connecting...' : 'Connect Garmin'}
          </button>
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm font-semibold text-white/80">Garmin Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#007DC3' }}
          >
            {loading ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 bg-white/5 border border-white/10 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      </div>
      {syncResult && (
        <p className="text-xs text-white/60 mt-2">
          Synced {syncResult.synced} session{syncResult.synced !== 1 ? 's' : ''}
          {syncResult.skipped > 0 ? ` (${syncResult.skipped} already imported)` : ''}
          {syncResult.errors?.length > 0 ? ` — ${syncResult.errors.length} skipped` : ''}
        </p>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}
