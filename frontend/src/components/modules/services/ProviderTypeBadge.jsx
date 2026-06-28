import { useTranslation } from "react-i18next"
import { Zap, Wrench, Gauge, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const TYPE_CONFIG = {
  electrician: {
    labelKey: "typeElectrician",
    icon:    Zap,
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  repair_centre: {
    labelKey: "typeRepairCentre",
    icon:    Wrench,
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  meter_agent: {
    labelKey: "typeMeterAgent",
    icon:    Gauge,
    classes: "bg-purple-50 text-purple-700 border-purple-200",
  },
  new_connection_agent: {
    labelKey: "typeNewConnectionAgent",
    icon:    PlusCircle,
    classes: "bg-green-50 text-green-700 border-green-200",
  },
}

export function ProviderTypeBadge({ type, size = "sm" }) {
  const { t } = useTranslation()
  const config = TYPE_CONFIG[type] ?? {
    labelKey: null, icon: Zap, classes: "bg-slate-50 text-slate-600 border-slate-200"
  }
  const Icon  = config.icon
  const label = config.labelKey ? t(`services.${config.labelKey}`) : type

  return (
    <span className={cn(
      "inline-flex items-center gap-1 border rounded-full font-medium",
      size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
      config.classes
    )}>
      <Icon className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {label}
    </span>
  )
}
