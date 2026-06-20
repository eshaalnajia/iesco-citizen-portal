import { STATUS_COLORS, STATUS_LABELS } from "@/lib/mapConstants"

export function FeederStatusBadge({ status }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.no_data
  const label = STATUS_LABELS[status] || "Unknown"

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: color + "25", color }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
