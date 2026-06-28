import { cn }                  from "@/lib/utils"
import { Smartphone, Globe, Building2 } from "lucide-react"

const METHODS = [
  {
    id:       "jazzcash",
    label:    "JazzCash",
    sublabel: "Mobile account",
    icon:     Smartphone,
    color:    "border-red-200 bg-red-50 text-red-700",
    selected: "border-red-400 bg-red-50 ring-2 ring-red-200",
  },
  {
    id:       "easypaisa",
    label:    "EasyPaisa",
    sublabel: "Mobile account",
    icon:     Smartphone,
    color:    "border-green-200 bg-green-50 text-green-700",
    selected: "border-green-400 bg-green-50 ring-2 ring-green-200",
  },
  {
    id:       "bank",
    label:    "Bank / ATM",
    sublabel: "Any bank channel",
    icon:     Building2,
    color:    "border-slate-200 bg-slate-50 text-slate-700",
    selected: "border-slate-400 bg-slate-50 ring-2 ring-slate-200",
  },
]

export function PaymentMethodSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {METHODS.map((m) => {
        const Icon     = m.icon
        const isActive = value === m.id
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2",
              "transition-all text-center",
              isActive ? m.selected : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? m.color.split(" ")[2] : "text-slate-400")} />
            <span className={cn(
              "text-xs font-semibold",
              isActive ? m.color.split(" ")[2] : "text-slate-700"
            )}>
              {m.label}
            </span>
            <span className="text-[10px] text-slate-400">{m.sublabel}</span>
          </button>
        )
      })}
    </div>
  )
}
