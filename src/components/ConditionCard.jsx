export default function ConditionCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-[#112240] border border-[#1e3a5f] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className="text-xs font-semibold text-[#4a6a8a] uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-sm text-[#7eb8e0] mt-1">{subtitle}</p>}
    </div>
  )
}
