export default function ConditionCard({ title, value, subtitle, accentColor }) {
  return (
    <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-3 sm:p-4 relative overflow-hidden">
      {accentColor && (
        <div
          className="absolute top-0 left-0 w-full h-0.5"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <h3 className="text-[10px] sm:text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
        {title}
      </h3>
      <p className="text-xl sm:text-2xl font-bold text-white leading-tight">{value}</p>
      {subtitle && <p className="text-xs sm:text-sm text-[#7eb8e0] mt-1">{subtitle}</p>}
    </div>
  )
}
