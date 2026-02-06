import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const API_KEY = process.env.STORMGLASS_API_KEY

app.use(cors())
app.use(express.json())

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

app.listen(PORT, () => {
  console.log(`Ocean Conditions API running on http://localhost:${PORT}`)
  console.log(`StormGlass API key: ${API_KEY ? 'configured' : 'NOT SET — using Open-Meteo fallback'}`)
  console.log(`Loaded ${spots.length} spots`)
})
