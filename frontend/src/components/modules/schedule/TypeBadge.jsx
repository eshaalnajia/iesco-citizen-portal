const TYPE_CONFIG = {
  scheduled:   { label: "Scheduled",   classes: "bg-blue-50   text-blue-700   border-blue-200"   },
  unplanned:   { label: "Unplanned",   classes: "bg-red-50    text-red-700    border-red-200"    },
  maintenance: { label: "Maintenance", classes: "bg-amber-50  text-amber-700  border-amber-200" },
}

export function TypeBadge({ type }) {
  const { label, classes } = TYPE_CONFIG[type] ?? TYPE_CONFIG.scheduled
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5
                      rounded-full border ${classes}`}>
      {label}
    </span>
  )
}
