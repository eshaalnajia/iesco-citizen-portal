const STATUS_CONFIG = {
  on: {
    dot:   "bg-green-500",
    text:  "text-green-700",
    bg:    "bg-green-50 border-green-200",
    label: "Power ON",
  },
  shedding_soon: {
    dot:   "bg-amber-500",
    text:  "text-amber-700",
    bg:    "bg-amber-50 border-amber-200",
    label: "Shedding soon",
  },
  load_shedding: {
    dot:   "bg-orange-500",
    text:  "text-orange-700",
    bg:    "bg-orange-50 border-orange-200",
    label: "Load shedding",
  },
  fault: {
    dot:   "bg-red-500",
    text:  "text-red-700",
    bg:    "bg-red-50 border-red-200",
    label: "Fault / outage",
  },
  maintenance: {
    dot:   "bg-blue-500",
    text:  "text-blue-700",
    bg:    "bg-blue-50 border-blue-200",
    label: "Maintenance",
  },
  no_data: {
    dot:   "bg-slate-400",
    text:  "text-slate-500",
    bg:    "bg-slate-50 border-slate-200",
    label: "No data",
  },
}

export function FeederStatusPill({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.no_data
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium
                      px-2 py-0.5 rounded-full border ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  )
}
