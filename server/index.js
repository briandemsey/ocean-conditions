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
  isGarminConfigured, generatePKCE, buildAuthUrl, exchangeCode,
  refreshAccessToken, fetchActivities, findNearestSpot, activityToSession, revokeToken,
} from './garmin.js'
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
  insertNotification, getUnreadCount, getNotifications, markRead, markAllRead, deleteNotificationOnUnkudos,
  insertSpotReview, getSpotReviewsBySpot, deleteSpotReview, getSpotAverageRating,
  updateGarminTokens, clearGarminTokens, getUserByGarminId, getGarminTokens,
  getSessionByGarminActivity, getUserGarminStatus, insertGarminSession,
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

// --- Spot Review Routes ---

// GET /api/spots/:spotId/reviews — public, get reviews for a spot
app.get('/api/spots/:spotId/reviews', (req, res) => {
  const reviews = getSpotReviewsBySpot.all(req.params.spotId)
  const stats = getSpotAverageRating.get(req.params.spotId)
  res.json({
    reviews,
    avg_rating: stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : null,
    review_count: stats.review_count,
  })
})

// POST /api/spots/:spotId/reviews — auth required, create a review
app.post('/api/spots/:spotId/reviews', requireAuth, (req, res) => {
  const { rating, body } = req.body
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer from 1 to 5' })
  }
  if (!body || typeof body !== 'string' || body.trim().length === 0 || body.length > 500) {
    return res.status(400).json({ error: 'Review body must be 1-500 characters' })
  }
  insertSpotReview.run(req.user.id, req.params.spotId, rating, body.trim())
  const reviews = getSpotReviewsBySpot.all(req.params.spotId)
  const stats = getSpotAverageRating.get(req.params.spotId)
  res.status(201).json({
    reviews,
    avg_rating: stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : null,
    review_count: stats.review_count,
  })
})

// DELETE /api/reviews/:id — auth required, owner only
app.delete('/api/reviews/:id', requireAuth, (req, res) => {
  const result = deleteSpotReview.run(req.params.id, req.user.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Review not found or not yours' })
  }
  res.json({ success: true })
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

// --- Garmin PKCE state store (in-memory, 10-min TTL) ---
const pkceStore = new Map()
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of pkceStore) {
    if (val.expiresAt < now) pkceStore.delete(key)
  }
}, 60_000)

// --- Garmin Routes ---

// GET /api/auth/garmin — start Garmin OAuth flow
app.get('/api/auth/garmin', requireAuth, (req, res) => {
  if (!isGarminConfigured()) {
    return res.status(503).json({ error: 'Garmin integration is not configured. GARMIN_CLIENT_ID and GARMIN_CLIENT_SECRET must be set.' })
  }
  const state = crypto.randomBytes(16).toString('hex')
  const { verifier, challenge } = generatePKCE()
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/garmin/callback`
  pkceStore.set(state, { verifier, userId: req.user.id, expiresAt: Date.now() + 10 * 60 * 1000 })
  const url = buildAuthUrl(state, challenge, redirectUri)
  res.json({ url })
})

// GET /api/auth/garmin/callback — exchange code for tokens
app.get('/api/auth/garmin/callback', async (req, res) => {
  const { code, state } = req.query
  if (!code || !state) return res.status(400).send('Missing code or state')
  const pkce = pkceStore.get(state)
  if (!pkce) return res.status(400).send('Invalid or expired state')
  pkceStore.delete(state)

  try {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/garmin/callback`
    const tokens = await exchangeCode(code, pkce.verifier, redirectUri)
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 7776000) * 1000).toISOString()
    updateGarminTokens.run({
      garmin_access_token: tokens.access_token,
      garmin_refresh_token: tokens.refresh_token,
      garmin_token_expires_at: expiresAt,
      garmin_user_id: tokens.user_id || null,
      id: pkce.userId,
    })
    const user = getUserById.get(pkce.userId)
    res.redirect(`/athlete/${user.username}?garmin=connected`)
  } catch (err) {
    console.error('Garmin callback error:', err.message)
    res.status(500).send('Failed to connect Garmin account')
  }
})

// POST /api/auth/garmin/disconnect — revoke and clear Garmin tokens
app.post('/api/auth/garmin/disconnect', requireAuth, async (req, res) => {
  const tokens = getGarminTokens.get(req.user.id)
  if (tokens?.garmin_access_token) {
    await revokeToken(tokens.garmin_access_token)
  }
  clearGarminTokens.run(req.user.id)
  res.json({ success: true })
})

// GET /api/garmin/status — check Garmin connection status
app.get('/api/garmin/status', requireAuth, (req, res) => {
  const row = getUserGarminStatus.get(req.user.id)
  res.json({
    connected: !!row?.garmin_user_id,
    garmin_user_id: row?.garmin_user_id || null,
    expires_at: row?.garmin_token_expires_at || null,
  })
})

// POST /api/garmin/sync — manual sync of last 30 days
app.post('/api/garmin/sync', requireAuth, async (req, res) => {
  if (!isGarminConfigured()) {
    return res.status(503).json({ error: 'Garmin integration is not configured' })
  }
  const tokens = getGarminTokens.get(req.user.id)
  if (!tokens?.garmin_access_token) {
    return res.status(400).json({ error: 'Garmin account not connected' })
  }

  try {
    let accessToken = tokens.garmin_access_token
    // Refresh if expired
    if (tokens.garmin_token_expires_at && new Date(tokens.garmin_token_expires_at) < new Date()) {
      const refreshed = await refreshAccessToken(tokens.garmin_refresh_token)
      accessToken = refreshed.access_token
      const expiresAt = new Date(Date.now() + (refreshed.expires_in || 7776000) * 1000).toISOString()
      updateGarminTokens.run({
        garmin_access_token: refreshed.access_token,
        garmin_refresh_token: refreshed.refresh_token || tokens.garmin_refresh_token,
        garmin_token_expires_at: expiresAt,
        garmin_user_id: tokens.garmin_user_id,
        id: req.user.id,
      })
    }

    const endEpoch = Date.now()
    const startEpoch = endEpoch - 30 * 24 * 60 * 60 * 1000
    const activities = await fetchActivities(accessToken, startEpoch, endEpoch)

    // Filter for surfing activities (Garmin activity type 38)
    const surfActivities = (activities || []).filter(a => a.activityType === 38 || a.activityType === 'SURFING')

    let synced = 0
    let skipped = 0
    const errors = []

    for (const activity of surfActivities) {
      const activityId = String(activity.activityId)
      // Skip duplicates
      if (getSessionByGarminActivity.get(activityId)) {
        skipped++
        continue
      }

      // Match to nearest spot using GPS coordinates
      const lat = activity.startLatitudeInDegree || activity.startLatitude
      const lng = activity.startLongitudeInDegree || activity.startLongitude
      if (lat == null || lng == null) {
        errors.push(`Activity ${activityId}: no GPS coordinates`)
        continue
      }

      const spot = findNearestSpot(lat, lng, spots)
      if (!spot) {
        errors.push(`Activity ${activityId}: no spot within 10km`)
        continue
      }

      const session = activityToSession(activity, spot)
      session.user_id = req.user.id
      insertGarminSession.run(session)
      synced++
    }

    res.json({ synced, skipped, errors })
  } catch (err) {
    console.error('Garmin sync error:', err.message)
    res.status(500).json({ error: 'Sync failed: ' + err.message })
  }
})

// POST /api/garmin/webhook — receive Garmin activity notifications
app.post('/api/garmin/webhook', express.json(), async (req, res) => {
  // Acknowledge immediately
  res.status(200).json({ ok: true })

  // Process async
  try {
    const activities = req.body.activities || req.body.activityDetails || []
    for (const activity of activities) {
      if (activity.activityType !== 38 && activity.activityType !== 'SURFING') continue

      const garminUserId = String(activity.userId || activity.userAccessToken)
      const user = getUserByGarminId.get(garminUserId)
      if (!user) continue

      const activityId = String(activity.activityId)
      if (getSessionByGarminActivity.get(activityId)) continue

      const lat = activity.startLatitudeInDegree || activity.startLatitude
      const lng = activity.startLongitudeInDegree || activity.startLongitude
      if (lat == null || lng == null) continue

      const spot = findNearestSpot(lat, lng, spots)
      if (!spot) continue

      const session = activityToSession(activity, spot)
      session.user_id = user.id
      insertGarminSession.run(session)
    }
  } catch (err) {
    console.error('Garmin webhook processing error:', err.message)
  }
})

// GET /api/garmin/webhook — Garmin verification endpoint
app.get('/api/garmin/webhook', (req, res) => {
  res.status(200).send('OK')
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

  const profileData = {
    user: { username: user.username, created_at: user.created_at, followers, following },
    stats: { ...stats, topSpot, topBoard },
    sessions: enrichSessions(sessions, req.user?.id),
  }

  // Include Garmin status when viewer is the profile owner
  if (req.user && req.user.id === user.id) {
    const garminStatus = getUserGarminStatus.get(user.id)
    profileData.garmin_connected = !!garminStatus?.garmin_user_id
  }

  res.json(profileData)
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
  insertNotification.run(target.id, req.user.id, 'follow', null, null)
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

// --- Notification Routes ---

// GET /api/notifications/unread-count — get unread notification count
app.get('/api/notifications/unread-count', requireAuth, (req, res) => {
  const { count } = getUnreadCount.get(req.user.id)
  res.json({ count })
})

// GET /api/notifications — get recent notifications
app.get('/api/notifications', requireAuth, (req, res) => {
  const notifications = getNotifications.all(req.user.id)
  res.json(notifications)
})

// PUT /api/notifications/read-all — mark all notifications as read
app.put('/api/notifications/read-all', requireAuth, (req, res) => {
  markAllRead.run(req.user.id)
  res.json({ success: true })
})

// PUT /api/notifications/:id/read — mark one notification as read
app.put('/api/notifications/:id/read', requireAuth, (req, res) => {
  markRead.run(req.params.id, req.user.id)
  res.json({ success: true })
})

// DELETE /api/notifications/:id — delete a notification
app.delete('/api/notifications/:id', requireAuth, (req, res) => {
  markRead.run(req.params.id, req.user.id)
  res.json({ success: true })
})

// --- Kudos Routes ---

// POST /api/sessions/:id/kudos — give kudos to a session
app.post('/api/sessions/:id/kudos', requireAuth, (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  insertKudos.run(req.user.id, session.id)
  if (session.user_id && session.user_id !== req.user.id) {
    insertNotification.run(session.user_id, req.user.id, 'kudos', session.id, null)
  }
  const count = getKudosCount.get(session.id).count
  res.json({ kudos: true, count })
})

// DELETE /api/sessions/:id/kudos — remove kudos from a session
app.delete('/api/sessions/:id/kudos', requireAuth, (req, res) => {
  const session = getSessionById.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  deleteKudos.run(req.user.id, session.id)
  deleteNotificationOnUnkudos.run(req.user.id, session.id)
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
  if (session.user_id && session.user_id !== req.user.id) {
    insertNotification.run(session.user_id, req.user.id, 'comment', session.id, comment.id)
  }
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
