export default function RatingBadge({ level, label, color, size = 'md' }) {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold text-white ${sizes[size]}`}
      style={{ backgroundColor: color }}
    >
      <span className="font-mono">{level}</span>
      <span className="font-medium">{label}</span>
    </span>
  )
}
