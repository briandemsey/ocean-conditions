/**
 * Multi-source agreement score display.
 * Shows how many data sources agree on conditions.
 */
export default function AgreementScore({ sources, field }) {
  if (!sources || sources.length === 0) return null

  // Extract values for the given field from each source
  const values = sources
    .map((s) => s[field])
    .filter((v) => v != null)

  if (values.length < 2) return null

  // Calculate coefficient of variation (lower = more agreement)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length)
  const cv = mean > 0 ? stdDev / mean : 0

  // Convert to a 0-100 agreement score (inverted CV)
  const score = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)))

  // Color based on agreement level
  let color, label
  if (score >= 85) {
    color = '#689F38'
    label = 'High Agreement'
  } else if (score >= 65) {
    color = '#FBC02D'
    label = 'Moderate Agreement'
  } else {
    color = '#F57C00'
    label = 'Low Agreement'
  }

  return (
    <div className="flex items-center gap-3 bg-[#112240] border border-[#1e3a5f] rounded-lg px-4 py-3">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
        style={{ backgroundColor: color }}
      >
        {score}
      </div>
      <div>
        <p className="text-white font-medium text-sm">{label}</p>
        <p className="text-white/60 text-xs">{values.length} sources reporting</p>
      </div>
    </div>
  )
}
