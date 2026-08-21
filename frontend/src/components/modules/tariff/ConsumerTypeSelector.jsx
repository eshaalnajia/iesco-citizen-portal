import { cn } from "@/lib/utils"
import { Home, Store, Factory, Wheat } from "lucide-react"

const TYPES = [
  {
    value: "residential",
    label: "Residential",
    sublabel: "Homes & apartments",
    icon: Home,
  },
  {
    value: "commercial",
    label: "Commercial",
    sublabel: "Shops & offices",
    icon: Store,
  },
  {
    value: "industrial",
    label: "Industrial",
    sublabel: "Factories",
    icon: Factory,
  },
  {
    value: "agricultural",
    label: "Agricultural",
    sublabel: "Tube wells & farms",
    icon: Wheat,
  },
]

export function ConsumerTypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {TYPES.map((type) => {
        const Icon = type.icon
        const selected = value === type.value
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4",
              "text-center transition-all duration-150",
              selected
                ? "border-iesco-teal bg-iesco-teal/5 text-iesco-teal"
                : "border-slate-200 bg-white dark:bg-card text-slate-600 dark:text-muted-foreground hover:border-slate-300"
            )}
          >
            <Icon className={cn(
              "h-6 w-6",
              selected ? "text-iesco-teal" : "text-slate-400 dark:text-muted-foreground"
            )} />
            <div>
              <p className={cn(
                "text-sm font-medium",
                selected ? "text-iesco-teal" : "text-slate-700 dark:text-foreground"
              )}>
                {type.label}
              </p>
              <p className="text-xs text-slate-400 dark:text-muted-foreground mt-0.5">
                {type.sublabel}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
