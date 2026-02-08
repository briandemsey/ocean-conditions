/**
 * Formatting utilities for ocean conditions data.
 */

const COMPASS_POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

/**
 * Convert degrees to compass direction (e.g., 225 → "SW").
 */
export function degreesToCompass(deg) {
  if (deg == null) return '--'
  const idx = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16
  return COMPASS_POINTS[idx]
}

/**
 * Format wave height range (e.g., "2-4 ft").
 */
export function formatHeightRange(min, max) {
  if (min == null && max == null) return '--'
  if (min == null) return `${max.toFixed(0)} ft`
  if (max == null) return `${min.toFixed(0)} ft`
  if (Math.abs(min - max) < 0.5) return `${min.toFixed(0)} ft`
  return `${min.toFixed(0)}-${max.toFixed(0)} ft`
}

/**
 * Format temperature with degree symbol.
 */
export function formatTemp(temp, unit = 'F') {
  if (temp == null) return '--'
  return `${Math.round(temp)}°${unit}`
}

/**
 * Format wind speed.
 */
export function formatWind(speed, gust) {
  if (speed == null) return '--'
  let s = `${Math.round(speed)} kts`
  if (gust != null && gust > speed + 3) s += ` (gusts ${Math.round(gust)})`
  return s
}

/**
 * Format time as HH:MM AM/PM.
 */
export function formatTime(isoString) {
  if (!isoString) return '--'
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format date as short string (e.g., "Mon Feb 6").
 */
export function formatDateShort(isoString) {
  if (!isoString) return '--'
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Celsius to Fahrenheit.
 */
export function cToF(c) {
  if (c == null) return null
  return c * 9 / 5 + 32
}

/**
 * Relative time string (e.g., "5m ago", "3h ago", "2d ago").
 */
export function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
