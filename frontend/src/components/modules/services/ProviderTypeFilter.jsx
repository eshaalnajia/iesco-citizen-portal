import { useTranslation } from "react-i18next"
import { cn }  from "@/lib/utils"
import { Zap, Wrench, Gauge, PlusCircle, LayoutGrid } from "lucide-react"

export function ProviderTypeFilter({ value, onChange }) {
  const { t } = useTranslation()

  const ALL_TYPES = [
    { value: null,                   labelKey: "allTypes",      icon: LayoutGrid },
    { value: "electrician",          labelKey: "electricians",  icon: Zap        },
    { value: "repair_centre",        labelKey: "repairCentres", icon: Wrench     },
    { value: "meter_agent",          labelKey: "meterAgents",   icon: Gauge      },
    { value: "new_connection_agent", labelKey: "newConnection", icon: PlusCircle },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 flex-nowrap">
      {ALL_TYPES.map((type) => {
        const Icon     = type.icon
        const selected = value === type.value
        return (
          <button
            key={String(type.value)}
            onClick={() => onChange(type.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
              "text-sm font-medium whitespace-nowrap border transition-colors",
              selected
                ? "bg-iesco-navy text-white border-iesco-navy"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", selected ? "text-white" : "text-slate-400")} />
            {t(`services.${type.labelKey}`)}
          </button>
        )
      })}
    </div>
  )
}
