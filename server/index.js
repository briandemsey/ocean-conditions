import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { readFile } from 'fs/promises'
import { unlinkSync, mkdirSync } from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { signToken, extractUser, requireAuth } from './auth.js'
import {
  insertUser, getUserByEmail, getUserById, getUserByUsername,
  insertSession, getSessionById,
  getSessionsByUser, getSessionsByUserAndSpot, getAllSessionsPublic,
  deleteSessionByIdAndUser,
  getStatsByUser, getTopSpotByUser, getTopBoardByUser, getWeeklyTrendByUser,
  getLeaderboardSessions, getLeaderboardSessionsMonth,
  getLeaderboardWaves, getLeaderboardWavesMonth,
  getLeaderboardBiggestWaves, getLeaderboardBiggestWavesMonth,
  getLeaderboardTime, getLeaderboardTimeMonth,
  getLeaderboardRating, getLeaderboardRatingMonth,
  getSpotLeaderboard, getSpotLeaderboardMonth,
  insertFollow, deleteFollow, getFollowStatus, getFollowerCount, getFollowingCount, getFollowingFeed,
  insertKudos, deleteKudos, getKudosCount, getUserKudos, getKudosForSessions, getUserKudosForSessions,
  insertComment, deleteComment, getCommentById, getCommentsBySession, getCommentCountForSessions, getCommentCountBySession,
  insertPhoto, getPhotosBySession, getPhotoById, deletePhotoById, getPhotoCountBySession, getPhotosForSessions,
  searchAthletes, getFollowStatusBulk,
} from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const API_KEY = process.env.STORMGLASS_API_KEY

app.use(cors())
app.use(express.json())
app.use(extractUser)

// Serve Vite production build
app.use(express.static(join(__dirname, '..', 'dist')))

// Create uploads directory and serve uploaded photos
const uploadsDir = join(__dirname, 'data', 'uploads')
mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`)
  },
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function createUpload(maxCount) {
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true)
      else cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, PNG, and WebP images are allowed'))
    },
  }).array('photos', maxCount)
}

// Load spots database
const spotsPath = join(__dirname, 'data', 'spots.json')
let spots = []
try {
  spots = JSON.parse(await readFile(spotsPath, 'utf-8'))
} catch (err) {
  console.error('Failed to load spots:', err.message)
}

// --- Helper: fetch from StormGlass ---
async function fetchStormGlass(endpoint, params) {
  const url = new URL(`https://api.stormglass.io/v2${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { Authorization: API_KEY },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`StormGlass ${res.status}: ${text}`)
  }

  return res.json()
}

// --- Helper: fetch from Open-Meteo (free fallback) ---
async function fetchOpenMeteoMarine(lat, lng, days = 7) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&forecast_days=${days}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo Marine ${res.status}`)
  return res.json()
}

async function fetchOpenMeteoWeather(lat, lng, days = 7) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,relative_humidity_2m,cloud_cover&current=temperature_2m,wind_speed_10m,wind_direction_10m&forecast_days=${days}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo Weather ${res.status}`)
  return res.json()
}

// --- Helper: enrich sessions with kudos/comment counts + photos ---
function enrichSessions(sessions, userId) {
  if (sessions.length === 0) return sessions
  const ids = JSON.stringify(sessions.map(s => s.id))
  const kudosCounts = Object.fromEntries(
    getKudosForSessions.all(ids).map(r => [r.session_id, r.count])
  )
  const commentCounts = Object.fromEntries(
    getCommentCountForSessions.all(ids).map(r => [r.session_id, r.count])
  )
  const userKudosSet = userId
    ? new Set(getUserKudosForSessions.all(userId, ids).map(r => r.session_id))
    : new Set()
  const allPhotos = getPhotosForSessions.all(ids)
  const photosMap = {}
  for (const p of allPhotos) {
    if (!photosMap[p.session_id]) photosMap[p.session_id] = []
    photosMap[p.session_id].push({ id: p.id, filename: p.filename, url: `/uploads/${p.filename}` })
  }
  return sessions.map(s => ({
    ...s,
    kudos_count: kudosCounts[s.id] || 0,
    comment_count: commentCounts[s.id] || 0,
    user_kudos: userKudosSet.has(s.id),
    photos: photosMap[s.id] || [],
  }))
}

// --- Routes ---

// GET /api/spots — return all spots
app.get('/api/spots', (req, res) => {
  res.json(spots)
})

// GET /api/spots/:id — return a single spot
app.get('/api/spots/:id', (req, res) => {
  const spot = spots.find((s) => s.id === req.params.id)
  if (!spot) return res.status(404).json({ error: 'Spot not found' })
  res.json(spot)
})

// GET /api/conditions/:spotId — current conditions
app.get('/api/conditions/:spotId', async (req, res) => {
  const spot = spots.find((s) => s.id === req.params.spotId)
  if (!spot) return res.status(404).json({ error: 'Spot not found' })

  try {
    if (API_KEY) {
      const now = new Date().toISOString()
      const end = new Date(Date.now() + 3600000).toISOString()
      const data = await fetchStormGlass('/weather/point', {
        lat: spot.lat,
        lng: spot.lng,
        params:
          'waveHeight,wavePeriod,waveDirection,swellHeight,swellPeriod,swellDirection,secondarySwellHeight,secondarySwellPeriod,windSpeed,windDirection,gust,airTemperature,waterTemperature',
        source: 'sg,noaa,dwd,meteo,meto',
        start: now,
        end: end,
      })
      return res.json({ source: 'stormglass', spot, data })
    }

    // Fallback to Open-Meteo
    const [marine, weather] = await Promise.all([
      fetchOpenMeteoMarine(spot.lat, spot.lng, 1),
      fetchOpenMeteoWeather(spot.lat, spot.lng, 1),
    ])
    res.json({ source: 'open-meteo', spot, marine, weather })
  } catch (err) {
    console.error('Conditions error:', err.message)
    // Try Open-Meteo fallback
    try {
      const [marine, weather] = await Promise.all([
        fetchOpenMeteoMarine(spot.lat, spot.lng, 1),
        fetchOpenMeteoWeather(spot.lat, spot.lng, 1),
      ])
      res.json({ source: 'open-meteo-fallback', spot, marine, weather })
    } catch (fallbackErr) {
      res.status(502).json({ error: 'All data sources failed', detail: err.message })
    }
  }
})

// GET /api/forecast/:spotId — multi-day forecast
app.get('/api/forecast/:spotId', async (req, res) => {
  const spot = spots.find((s) => s.id === req.params.spotId)
  if (!spot) return res.status(404).json({ error: 'Spot not found' })

  const days = parseInt(req.query.days) || 7

  try {
    if (API_KEY) {
      const start = new Date().toISOString()
      const end = new Date(Date.now() + days * 86400000).toISOString()
      const data = await fetchStormGlass('/weather/point', {
        lat: spot.lat,
        lng: spot.lng,
        params:
          'waveHeight,wavePeriod,waveDirection,swellHeight,swellPeriod,swellDirection,windSpeed,windDirection,gust,airTemperature,waterTemperature',
        source: 'sg,noaa',
        start,
        end,
      })
      return res.json({ source: 'stormglass', spot, data })
    }

    const [marine, weather] = await Promise.all([
      fetchOpenMeteoMarine(spot.lat, spot.lng, days),
      fetchOpenMeteoWeather(spot.lat, spot.lng, days),
    ])
    res.json({ source: 'open-meteo', spot, marine, weather })
  } catch (err) {
    console.error('Forecast error:', err.message)
    try {
      const [marine, weather] = await Promise.all([
        fetchOpenMeteoMarine(spot.lat, spot.lng, days),
        fetchOpenMeteoWeather(spot.lat, spot.lng, days),
      ])
      res.json({ source: 'open-meteo-fallback', spot, marine, weather })
    } catch (fallbackErr) {
      res.status(502).json({ error: 'All data sources failed', detail: err.message })
    }
  }
})

// GET /api/tides/:spotId — tide data
app.get('/api/tides/:spotId', async (req, res) => {
  const spot = spots.find((s) => s.id === req.params.spotId)
  if (!spot) return res.status(404).json({ error: 'Spot not found' })

  try {
    if (API_KEY) {
      const start = new Date().toISOString()
      const end = new Date(Date.now() + 86400000).toISOString()
      const data = await fetchStormGlass('/tide/extremes/point', {
        lat: spot.lat,
        lng: spot.lng,
        start,
        end,
      })
      return res.json({ source: 'stormglass', spot, data })
    }
    res.json({ source: 'none', spot, message: 'Tide data requires StormGlass API key' })
  } catch (err) {
    console.error('Tides error:', err.message)
    res.status(502).json({ error: 'Tide data unavailable', detail: err.message })
  }
})

// GET /api/compare/:spotId — multi-source comparison (Screen 5)
app.get('/api/compare/:spotId', async (req, res) => {
  const spot = spots.find((s) => s.id === req.params.spotId)
  if (!spot) return res.status(404).json({ error: 'Spot not found' })

  try {
    if (API_KEY) {
      const start = new Date().toISOString()
      const end = new Date(Date.now() + 3 * 86400000).toISOString()
      const data = await fetchStormGlass('/weather/point', {
        lat: spot.lat,
        lng: spot.lng,
        params: 'waveHeight,swellHeight,windSpeed',
        source: 'sg,noaa,dwd,meteo,meto',
        start,
        end,
      })
      return res.json({ source: 'stormglass', spot, data })
    }

    res.json({ source: 'none', spot, message: 'Multi-source comparison requires StormGlass API key' })
  } catch (err) {
    console.error('Compare error:', err.message)
    res.status(502).json({ error: 'Comparison data unavailable', detail: err.message })
  }
})

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' })
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be 3-30 characters' })
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const existing = getUserByEmail.get(email)
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  try {
    const password_hash = await bcrypt.hash(password, 10)
    const result = insertUser.run({ username, email: email.toLowerCase().trim(), password_hash })
    const user = getUserById.get(result.lastInsertRowid)
    const token = signToken(user)
    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } })
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Username or email already taken' })
    }
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = getUserByEmail.get(email)
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signToken(user)
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = getUserById.get(req.user.id)
  if (!user) return res.status(401).json({ error: 'User not found' })
  res.json({ id: user.id, username: user.username, email: user.email })
})

// --- Session Routes ---

// GET /api/sessions/stats — user's stats (must be before :id route)
app.get('/api/sessions/stats', requireAuth, (req, res) => {
  const stats = getStatsByUser.get(req.user.id)
  const topSpot = getTopSpotByUser.get(req.user.id) || null
  const topBoard = getTopBoardByUser.get(req.user.id) || null
  const weekly = getWeeklyTrendByUser.all(req.user.id)
  res.json({ ...stats, topSpot, topBoard, weekly })
})

// GET /api/sessions — authenticated: user's sessions. Unauthenticated: public feed.
app.get('/api/sessions', (req, res) => {
  const { spotId } = req.query
  let sessions
  if (req.user) {
    sessions = spotId
      ? getSessionsByUserAndSpot.all(req.user.id, spotId)
      : getSessionsByUser.all(req.user.id)
  } else {
    sessions = getAllSessionsPublic.all()
  }
  const parsed = sessions.map((s) => ({
    ...s,
    conditions: s.conditions ? JSON.parse(s.conditions) : null,
    username: s.username || 'Anonymous',
  }))
  res.json(enrichSessions(parsed, req.user?.id))
})

// GET /api/feed — public feed (all users' recent sessions)
app.get('/api/feed', (req, res) => {
  const { filter } = req.query
  let sessions
  if (filter === 'following' && req.user) {
    sessions = getFollowingFeed.all(req.user.id)
  } else {
    sessions = getAllSessionsPublic.all()
  }
  const parsed = sessions.map((s) => ({
    ...s,
    conditions: s.conditions ? JSON.parse(s.conditions) : null,
    username: s.username || 'Anonymous',
  }))
  res.json(enrichSessions(parsed, req.user?.id))
})

// GET /api/athletes/search?q=term — search athletes by username
app.get('/api/athletes/search', (req, res) => {
  const q = (req.query.q || '').trim()
  if (q.length < 1) return res.json([])

  const athletes = searchAthletes.all(`%${q}%`)

  if (req.user && athletes.length > 0) {
    const ids = JSON.stringify(athletes.map(a => a.id))
    const followedSet = new Set(
      getFollowStatusBulk.all(req.user.id, ids).map(r => r.following_id)
    )
    return res.json(athletes.map(a => ({
      ...a,
      is_following: followedSet.has(a.id),
      is_self: a.id === req.user.id,
    })))
  }

  res.json(athletes.map(a => ({ ...a, is_following: false, is_self: false })))
})

// GET /api/athletes/:username — public athlete profile
app.get('/api/athletes/:username', (req, res) => {
  const user = getUserByUsername.get(req.params.username)
  if (!user) return res.status(404).json({ error: 'Athlete not found' })

  const stats = getStatsByUser.get(user.id)
  const topSpot = getTopSpotByUser.get(user.id) || null
  const topBoard = getTopBoardByUser.get(user.id) || null
  const followers = getFollowerCount.get(user.id).count
  const following = getFollowingCount.get(user.id).count
  const sessions = getSessionsByUser.all(user.id).slice(0, 20).map((s) => ({
    ...s,
    conditions: s.conditions ? JSON.parse(s.conditions) : null,
    username: s.username || user.username,
  }))

  res.json({
    user: { username: user.username, created_at: user.created_at, followers, following },
    stats: { ...stats, topSpot, topBoard },
    sessions: enrichSessions(sessions, req.user?.id),
  })
})

// --- Leaderboard Routes (public) ---

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

// GET /api/leaderboards — global leaderboards
app.get('/api/leaderboards', (req, res) => {
  const monthly = req.query.period === 'month'
  const sessions = (monthly ? getLeaderboardSessionsMonth : getLeaderboardSessions).all()
  const waves = (monthly ? getLeaderboardWavesMonth : getLeaderboardWaves).all()
  const biggestWaves = (monthly ? getLeaderboardBiggestWavesMonth : getLeaderboardBiggestWaves).all()
  const time = (monthly ? getLeaderboardTimeMonth : getLeaderboardTime).all().map(r => ({
    ...r, formatted: formatDuration(r.value)
  }))
  const rating = (monthly ? getLeaderboardRatingMonth : getLeaderboardRating).all()
  res.json({ sessions, waves, biggestWaves, time, rating })
})

// GET /api/leaderboards/spot/:spotId — per-spot leaderboard
app.get('/api/leaderboards/spot/:spotId', (req, res) => {
  const monthly = req.query.period === 'month'
  const rows = (monthly ? getSpotLeaderboardMonth : getSpotLeaderboard).all(req.params.spotId)
  const result = rows.map(r => ({
    ...r, total_time_formatted: formatDuration(r.total_time)
  }))
  res.json(result)
})

// GET /api/sessions/:id — single session (public)
app.get('/api/sessions/:id', (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  session.conditions = session.conditions ? JSON.parse(session.conditions) : null
  session.username = session.username || 'Anonymous'
  session.kudos_count = getKudosCount.get(session.id).count
  session.comment_count = getCommentCountBySession.get(session.id).count
  session.user_kudos = req.user ? !!getUserKudos.get(req.user.id, session.id) : false
  session.photos = getPhotosBySession.all(session.id).map(p => ({
    id: p.id, filename: p.filename, url: `/uploads/${p.filename}`
  }))
  res.json(session)
})

// POST /api/sessions — create session (requires auth)
app.post('/api/sessions', requireAuth, (req, res) => {
  const { spot_id, spot_name, date, start_time, duration, wave_count, board, notes, rating, conditions } = req.body
  if (!spot_id || !spot_name || !date || !duration) {
    return res.status(400).json({ error: 'Missing required fields: spot_id, spot_name, date, duration' })
  }

  const result = insertSession.run({
    spot_id,
    spot_name,
    date,
    start_time: start_time || null,
    duration: parseInt(duration),
    wave_count: wave_count ? parseInt(wave_count) : null,
    board: board || null,
    notes: notes || null,
    rating: rating ? parseInt(rating) : null,
    conditions: conditions ? JSON.stringify(conditions) : null,
    user_id: req.user.id,
  })

  const session = getSessionById.get(result.lastInsertRowid)
  session.conditions = session.conditions ? JSON.parse(session.conditions) : null
  res.status(201).json(session)
})

// DELETE /api/sessions/:id — delete session (requires auth, must be owner)
app.delete('/api/sessions/:id', requireAuth, (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (session.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your session' })
  }
  // Delete photo files from disk before CASCADE removes DB rows
  const photos = getPhotosBySession.all(session.id)
  for (const photo of photos) {
    try { unlinkSync(join(uploadsDir, photo.filename)) } catch {}
  }
  deleteSessionByIdAndUser.run(req.params.id, req.user.id)
  res.json({ success: true })
})

// --- Follow Routes ---

// POST /api/follows/:username — follow a user
app.post('/api/follows/:username', requireAuth, (req, res) => {
  const target = getUserByUsername.get(req.params.username)
  if (!target) return res.status(404).json({ error: 'User not found' })
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' })
  insertFollow.run(req.user.id, target.id)
  res.json({ following: true })
})

// DELETE /api/follows/:username — unfollow a user
app.delete('/api/follows/:username', requireAuth, (req, res) => {
  const target = getUserByUsername.get(req.params.username)
  if (!target) return res.status(404).json({ error: 'User not found' })
  deleteFollow.run(req.user.id, target.id)
  res.json({ following: false })
})

// GET /api/follows/:username/status — check if current user follows target
app.get('/api/follows/:username/status', requireAuth, (req, res) => {
  const target = getUserByUsername.get(req.params.username)
  if (!target) return res.status(404).json({ error: 'User not found' })
  const row = getFollowStatus.get(req.user.id, target.id)
  res.json({ following: !!row })
})

// --- Kudos Routes ---

// POST /api/sessions/:id/kudos — give kudos to a session
app.post('/api/sessions/:id/kudos', requireAuth, (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  insertKudos.run(req.user.id, session.id)
  const count = getKudosCount.get(session.id).count
  res.json({ kudos: true, count })
})

// DELETE /api/sessions/:id/kudos — remove kudos from a session
app.delete('/api/sessions/:id/kudos', requireAuth, (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  deleteKudos.run(req.user.id, session.id)
  const count = getKudosCount.get(session.id).count
  res.json({ kudos: false, count })
})

// --- Photo Routes ---

// GET /api/sessions/:id/photos — list photos for a session (public)
app.get('/api/sessions/:id/photos', (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const photos = getPhotosBySession.all(session.id).map(p => ({
    id: p.id, filename: p.filename, url: `/uploads/${p.filename}`
  }))
  res.json(photos)
})

// POST /api/sessions/:id/photos — upload photos (auth, owner only)
app.post('/api/sessions/:id/photos', requireAuth, (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (session.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your session' })
  }

  const currentCount = getPhotoCountBySession.get(session.id).count
  const remaining = 3 - currentCount
  if (remaining <= 0) {
    return res.status(400).json({ error: 'Maximum 3 photos per session' })
  }

  const upload = createUpload(remaining)
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' })
        if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: `Maximum ${remaining} more photo(s) allowed` })
        return res.status(400).json({ error: err.message || 'Upload error' })
      }
      return res.status(400).json({ error: err.message || 'Upload error' })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos provided' })
    }

    const photos = req.files.map(f => {
      insertPhoto.run(session.id, f.filename, f.originalname)
      return { filename: f.filename, url: `/uploads/${f.filename}` }
    })

    res.status(201).json({ photos })
  })
})

// DELETE /api/sessions/:id/photos/:photoId — delete a photo (auth, owner only)
app.delete('/api/sessions/:id/photos/:photoId', requireAuth, (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (session.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your session' })
  }

  const photo = getPhotoById.get(req.params.photoId)
  if (!photo || photo.session_id !== session.id) {
    return res.status(404).json({ error: 'Photo not found' })
  }

  try { unlinkSync(join(uploadsDir, photo.filename)) } catch {}
  deletePhotoById.run(photo.id)
  res.json({ success: true })
})

// --- Comment Routes ---

// GET /api/sessions/:id/comments — get comments for a session
app.get('/api/sessions/:id/comments', (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const comments = getCommentsBySession.all(session.id)
  res.json(comments)
})

// POST /api/sessions/:id/comments — add a comment to a session
app.post('/api/sessions/:id/comments', requireAuth, (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const { body } = req.body
  if (!body || typeof body !== 'string' || body.trim().length === 0 || body.length > 500) {
    return res.status(400).json({ error: 'Comment body must be 1-500 characters' })
  }
  const result = insertComment.run(req.user.id, session.id, body.trim())
  const comment = getCommentById.get(result.lastInsertRowid)
  res.status(201).json(comment)
})

// DELETE /api/comments/:id — delete own comment
app.delete('/api/comments/:id', requireAuth, (req, res) => {
  const comment = getCommentById.get(req.params.id)
  if (!comment) return res.status(404).json({ error: 'Comment not found' })
  if (comment.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your comment' })
  }
  deleteComment.run(comment.id, req.user.id)
  res.json({ success: true })
})

// Catch-all: serve index.html for client-side routing
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Ocean Conditions API running on http://localhost:${PORT}`)
  console.log(`StormGlass API key: ${API_KEY ? 'configured' : 'NOT SET — using Open-Meteo fallback'}`)
  console.log(`Loaded ${spots.length} spots`)
})
