import crypto from 'crypto'

const GARMIN_CLIENT_ID = process.env.GARMIN_CLIENT_ID
const GARMIN_CLIENT_SECRET = process.env.GARMIN_CLIENT_SECRET
const GARMIN_AUTH_URL = 'https://connect.garmin.com/oauthConfirm'
const GARMIN_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/token'
const GARMIN_API_BASE = 'https://apis.garmin.com/wellness-api/rest'

export function isGarminConfigured() {
  return !!(GARMIN_CLIENT_ID && GARMIN_CLIENT_SECRET)
}

export function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function buildAuthUrl(state, codeChallenge, redirectUri) {
  const params = new URLSearchParams({
    client_id: GARMIN_CLIENT_ID,
    response_type: 'code',
    scope: 'activity:read',
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${GARMIN_AUTH_URL}?${params.toString()}`
}

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options)
    if (res.status === 429) {
      const delay = Math.pow(2, i) * 1000
      await new Promise(r => setTimeout(r, delay))
      continue
    }
    return res
  }
  return fetch(url, options)
}

export async function exchangeCode(code, codeVerifier, redirectUri) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: GARMIN_CLIENT_ID,
    client_secret: GARMIN_CLIENT_SECRET,
    code_verifier: codeVerifier,
  })
  const res = await fetchWithRetry(GARMIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Garmin token exchange failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: GARMIN_CLIENT_ID,
    client_secret: GARMIN_CLIENT_SECRET,
  })
  const res = await fetchWithRetry(GARMIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Garmin token refresh failed (${res.status}): ${text}`)
  }
  return res.json()
}

export async function fetchActivities(accessToken, startEpoch, endEpoch) {
  const params = new URLSearchParams({
    uploadStartTimeInSeconds: String(Math.floor(startEpoch / 1000)),
    uploadEndTimeInSeconds: String(Math.floor(endEpoch / 1000)),
  })
  const res = await fetchWithRetry(`${GARMIN_API_BASE}/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Garmin activities fetch failed (${res.status}): ${text}`)
  }
  return res.json()
}

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function findNearestSpot(lat, lng, spots, maxDistanceKm = 10) {
  let nearest = null
  let minDist = Infinity
  for (const spot of spots) {
    const dist = haversineDistance(lat, lng, spot.lat, spot.lng)
    if (dist < minDist && dist <= maxDistanceKm) {
      minDist = dist
      nearest = spot
    }
  }
  return nearest
}

export function activityToSession(activity, spot) {
  const startTime = new Date(activity.startTimeInSeconds * 1000)
  const date = startTime.toISOString().split('T')[0]
  const hours = String(startTime.getUTCHours()).padStart(2, '0')
  const mins = String(startTime.getUTCMinutes()).padStart(2, '0')
  const durationMinutes = Math.round((activity.durationInSeconds || 0) / 60)

  return {
    spot_id: spot.id,
    spot_name: spot.name,
    date,
    start_time: `${hours}:${mins}`,
    duration: durationMinutes || 60,
    wave_count: null,
    board: null,
    notes: activity.activityName || 'Garmin sync',
    rating: null,
    conditions: null,
    garmin_activity_id: String(activity.activityId),
  }
}

export async function revokeToken(accessToken) {
  try {
    await fetchWithRetry('https://connectapi.garmin.com/oauth-service/oauth/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: accessToken }).toString(),
    })
  } catch {
    // Best-effort revocation
  }
}
