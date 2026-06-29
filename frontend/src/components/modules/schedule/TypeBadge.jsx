import { useTranslation } from "react-i18next"

const TYPE_CONFIG = {
  scheduled:   { key: "schedule.types.scheduled",   classes: "bg-blue-50   text-blue-700   border-blue-200"   },
  unplanned:   { key: "schedule.types.unplanned",   classes: "bg-red-50    text-red-700    border-red-200"    },
  maintenance: { key: "schedule.types.maintenance", classes: "bg-amber-50  text-amber-700  border-amber-200" },
}

export function TypeBadge({ type }) {
  const { t } = useTranslation()
  const { key, classes } = TYPE_CONFIG[type] ?? TYPE_CONFIG.scheduled
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5
                      rounded-full border ${classes}`}>
      {t(key)}
    </span>
  )
}
