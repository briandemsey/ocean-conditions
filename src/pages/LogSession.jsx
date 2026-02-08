import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import spots from '../data/spots'
import { getRatingByLevel, metersToFeet, msToKnots } from '../utils/ratings'
import { degreesToCompass, formatWind } from '../utils/formatting'
import { useAuth } from '../context/AuthContext'

export default function LogSession() {
  const { spotId: urlSpotId } = useParams()
  const navigate = useNavigate()
  const { user, authHeaders, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  const [spotId, setSpotId_] = useState(urlSpotId || '')
  const [date, setDate_] = useState(new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('00:00')
  const [duration, setDuration_] = useState('')

  // Clear validation error when required fields change
  const setSpotId = (v) => { setSpotId_(v); setError(null) }
  const setDate = (v) => { setDate_(v); setError(null) }
  const setDuration = (v) => { setDuration_(v); setError(null) }
  const [waveCount, setWaveCount] = useState('')
  const [board, setBoard] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [conditions, setConditions] = useState(null)
  const [conditionsLoading, setConditionsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)

  // Fetch conditions when spot is selected
  useEffect(() => {
    if (!spotId) { setConditions(null); return }
    setConditionsLoading(true)
    fetch(`/api/conditions/${spotId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) { setConditions(null); setConditionsLoading(false); return }
        const snapshot = parseConditions(data)
        setConditions(snapshot)
        setConditionsLoading(false)
      })
      .catch(() => { setConditions(null); setConditionsLoading(false) })
  }, [spotId])

  function parseConditions(data) {
    let waveHeight, swellPeriod, swellDir, windSpeed, windDir, windGust
    if (data.source === 'stormglass' && data.data?.hours?.[0]) {
      const h = data.data.hours[0]
      waveHeight = h.waveHeight?.sg ?? h.waveHeight?.noaa
      swellPeriod = h.swellPeriod?.sg ?? h.swellPeriod?.noaa
      swellDir = h.swellDirection?.sg ?? h.swellDirection?.noaa
      windSpeed = h.windSpeed?.sg ?? h.windSpeed?.noaa
      windDir = h.windDirection?.sg ?? h.windDirection?.noaa
      windGust = h.gust?.sg ?? h.gust?.noaa
    } else {
      const now = Date.now()
      let idx = 0
      if (data.marine?.hourly?.time) {
        let closest = Infinity
        data.marine.hourly.time.forEach((t, i) => {
          const diff = Math.abs(new Date(t).getTime() - now)
          if (diff < closest) { closest = diff; idx = i }
        })
      }
      if (data.marine?.hourly) {
        waveHeight = data.marine.hourly.wave_height?.[idx]
        swellPeriod = data.marine.hourly.wave_period?.[idx]
        swellDir = data.marine.hourly.swell_wave_direction?.[idx]
      }
      if (data.weather?.current) {
        windSpeed = data.weather.current.wind_speed_10m
        windDir = data.weather.current.wind_direction_10m
      }
    }

    const waveHeightFt = waveHeight != null ? metersToFeet(waveHeight) : null
    const windKnots = windSpeed != null ? msToKnots(windSpeed) : null
    const gustKnots = windGust != null ? msToKnots(windGust) : null

    return {
      waveHeight: waveHeightFt != null ? `${waveHeightFt.toFixed(1)} ft` : null,
      swellPeriod: swellPeriod != null ? `${swellPeriod.toFixed(0)}s @ ${degreesToCompass(swellDir)}` : null,
      wind: windKnots != null ? `${formatWind(windKnots, gustKnots)} ${degreesToCompass(windDir)}` : null,
    }
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_FILE_SIZE = 5 * 1024 * 1024

  function handleFileChange(e) {
    const files = Array.from(e.target.files)
    const total = selectedFiles.length + files.length
    if (total > 3) {
      setError(`Maximum 3 photos. You can add ${3 - selectedFiles.length} more.`)
      e.target.value = ''
      return
    }
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed')
        e.target.value = ''
        return
      }
      if (f.size > MAX_FILE_SIZE) {
        setError('Each photo must be under 5MB')
        e.target.value = ''
        return
      }
    }
    setError(null)
    const newFiles = [...selectedFiles, ...files]
    setSelectedFiles(newFiles)
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removeFile(index) {
    URL.revokeObjectURL(previews[index])
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()

    if (!spotId || !date || !duration) {
      setError('Please fill in spot, date, and duration.')
      return
    }

    const spot = spots.find((s) => s.id === spotId)
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          spot_id: spotId,
          spot_name: spot?.name || spotId,
          date,
          start_time: startTime || null,
          duration: parseInt(duration),
          wave_count: waveCount ? parseInt(waveCount) : null,
          board: board || null,
          notes: notes || null,
          rating: rating || null,
          conditions: conditions || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save session')
      }

      if (!data.id) {
        throw new Error('Session was not saved. Please try again.')
      }

      // Step 2: upload photos if any selected
      if (selectedFiles.length > 0) {
        setUploading(true)
        const formData = new FormData()
        selectedFiles.forEach(f => formData.append('photos', f))
        const photoRes = await fetch(`/api/sessions/${data.id}/photos`, {
          method: 'POST',
          headers: authHeaders(),
          body: formData,
        })
        if (!photoRes.ok) {
          const photoErr = await photoRes.json()
          throw new Error(photoErr.error || 'Failed to upload photos')
        }
      }

      navigate('/sessions')
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
      setUploading(false)
    }
  }

  const ratingLevels = [1, 2, 3, 4, 5, 6]

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/70 mb-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        <Link to="/sessions" className="hover:text-[#4a9eed] transition-colors">Sessions</Link>
        <span>/</span>
        <span className="text-white">Log Session</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
        Log a Surf Session
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        {/* Spot */}
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Spot *</label>
          <select
            name="spotId"
            value={spotId}
            onChange={(e) => setSpotId(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#112240] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none"
          >
            <option value="">Select a spot...</option>
            {spots.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Conditions snapshot */}
        {spotId && (
          <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg p-3">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Current Conditions</p>
            {conditionsLoading ? (
              <p className="text-sm text-white/40">Loading...</p>
            ) : conditions ? (
              <div className="flex flex-wrap gap-2">
                {conditions.waveHeight && (
                  <span className="px-2 py-0.5 bg-[#112240] border border-[#1e3a5f] rounded text-xs text-[#7eb8e0]">{conditions.waveHeight}</span>
                )}
                {conditions.swellPeriod && (
                  <span className="px-2 py-0.5 bg-[#112240] border border-[#1e3a5f] rounded text-xs text-[#7eb8e0]">{conditions.swellPeriod}</span>
                )}
                {conditions.wind && (
                  <span className="px-2 py-0.5 bg-[#112240] border border-[#1e3a5f] rounded text-xs text-[#7eb8e0]">{conditions.wind}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40">Conditions unavailable</p>
            )}
          </div>
        )}

        {/* Date + Start Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Date *</label>
            <input
              type="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#112240] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#112240] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none"
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Duration (minutes) *</label>
          <input
            type="number"
            name="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            placeholder="60"
            className="w-full px-3 py-2.5 bg-[#112240] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none mb-2"
          />
          <div className="flex gap-2">
            {[30, 60, 90, 120].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDuration(String(m))}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  duration === String(m)
                    ? 'bg-[#1976D2] text-white'
                    : 'bg-[#112240] border border-[#1e3a5f] text-white/60 hover:border-[#4a9eed]'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Wave Count */}
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Wave Count</label>
          <input
            type="number"
            name="waveCount"
            value={waveCount}
            onChange={(e) => setWaveCount(e.target.value)}
            min="0"
            placeholder="Optional"
            className="w-full px-3 py-2.5 bg-[#112240] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none"
          />
        </div>

        {/* Board */}
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Board</label>
          <input
            type="text"
            name="board"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            placeholder="e.g., 6'2 shortboard"
            className="w-full px-3 py-2.5 bg-[#112240] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
            Session Rating {rating > 0 && `— ${getRatingByLevel(rating).label}`}
          </label>
          <div className="flex gap-2">
            {ratingLevels.map((level) => {
              const r = getRatingByLevel(level)
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRating(rating === level ? 0 : level)}
                  className="w-9 h-9 rounded-full font-bold text-sm transition-all"
                  style={{
                    backgroundColor: rating === level ? r.color : '#0a1628',
                    border: `2px solid ${r.color}`,
                    color: rating === level ? '#fff' : r.color,
                    transform: rating === level ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {level}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Notes</label>
          <textarea
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="How was the session?"
            className="w-full px-3 py-2.5 bg-[#112240] border border-[#1e3a5f] rounded-lg text-white focus:border-[#4a9eed] focus:outline-none resize-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
            Photos ({selectedFiles.length}/3)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#1e3a5f]">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  x
                </button>
              </div>
            ))}
          </div>
          {selectedFiles.length < 3 && (
            <label className="inline-block px-3 py-1.5 bg-[#112240] border border-[#1e3a5f] rounded-lg text-sm text-white/60 hover:border-[#4a9eed] hover:text-white/80 transition-colors cursor-pointer">
              Add Photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-5 py-3 bg-[#1976D2] text-white rounded-lg font-medium hover:bg-[#1565C0] transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading photos...' : submitting ? 'Saving...' : 'Log Session'}
        </button>
      </form>
    </div>
  )
}
