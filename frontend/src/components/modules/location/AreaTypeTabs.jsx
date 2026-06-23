import { cn } from "@/lib/utils"

const AREA_TYPES = [
  { value: null,             label: "All areas" },
  { value: "sector",         label: "Sectors"   },
  { value: "satellite_town", label: "Satellite towns" },
  { value: "cantonment",     label: "Cantonments" },
  { value: "rural",          label: "Rural" },
]

export function AreaTypeTabs({ value, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 flex-nowrap">
      {AREA_TYPES.map((type) => (
        <button
          key={type.value ?? "all"}
          onClick={() => onChange(type.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap",
            "transition-colors border",
            value === type.value
              ? "bg-iesco-navy text-white border-iesco-navy"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          )}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}
