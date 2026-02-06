/**
 * Convert raw ocean data into a 0-6 surf rating.
 *
 * Factors: wave height, wind direction relative to swell, swell period.
 * Longer period swells with offshore wind rate higher than short-period chop
 * with onshore wind.
 */

// Rating thresholds
const RATINGS = [
  { level: 0, label: 'FLAT', color: '#8E8E8E', min: 0, max: 0.5 },
  { level: 1, label: 'VERY POOR', color: '#D32F2F', min: 0.5, max: 1 },
  { level: 2, label: 'POOR', color: '#F57C00', min: 1, max: 2 },
  { level: 3, label: 'POOR-FAIR', color: '#FBC02D', min: 2, max: 3 },
  { level: 4, label: 'FAIR', color: '#689F38', min: 3, max: 4 },
  { level: 5, label: 'GOOD', color: '#1976D2', min: 4, max: 6 },
  { level: 6, label: 'EPIC', color: '#7B1FA2', min: 6, max: Infinity },
]

/**
 * Calculate surf rating from wave height, wind speed/direction, and swell period.
 * Returns { level, label, color }
 */
export function calculateRating(waveHeightFt, windSpeed, windDir, swellDir, swellPeriod) {
  // Base rating from wave height
  let baseRating = RATINGS.find((r) => waveHeightFt >= r.min && waveHeightFt < r.max) || RATINGS[0]
  let level = baseRating.level

  // Wind modifier: offshore wind (opposite to swell) improves rating
  if (windSpeed != null && windDir != null && swellDir != null) {
    const angleDiff = Math.abs(((windDir - swellDir + 180) % 360) - 180)
    if (angleDiff > 135 && windSpeed < 15) {
      // Offshore wind — bump up
      level = Math.min(6, level + 1)
    } else if (angleDiff < 45 && windSpeed > 10) {
      // Strong onshore wind — bump down
      level = Math.max(0, level - 1)
    }
  }

  // Period modifier: long period swells (12s+) improve rating
  if (swellPeriod != null && swellPeriod >= 12 && level > 0) {
    level = Math.min(6, level + 1)
  }

  const rating = RATINGS[level]
  return { level: rating.level, label: rating.label, color: rating.color }
}

/**
 * Get rating info by level number.
 */
export function getRatingByLevel(level) {
  return RATINGS[Math.max(0, Math.min(6, Math.round(level)))]
}

/**
 * Get all ratings for reference.
 */
export function getAllRatings() {
  return RATINGS
}

/**
 * Convert meters to feet.
 */
export function metersToFeet(m) {
  return m * 3.28084
}

/**
 * Convert m/s to knots.
 */
export function msToKnots(ms) {
  return ms * 1.94384
}
