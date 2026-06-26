import { Clock, CheckCircle, AlertTriangle, Wrench, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const CONFIG = {
  on: {
    icon:    CheckCircle,
    classes: "bg-green-50 border-green-200 text-green-700",
    iconCls: "text-green-500",
  },
  scheduled: {
    icon:    Clock,
    classes: "bg-orange-50 border-orange-200 text-orange-700",
    iconCls: "text-orange-500",
  },
  upcoming: {
    icon:    Clock,
    classes: "bg-amber-50 border-amber-200 text-amber-700",
    iconCls: "text-amber-500",
  },
  fault: {
    icon:    AlertTriangle,
    classes: "bg-red-50 border-red-200 text-red-700",
    iconCls: "text-red-500",
  },
  maintenance: {
    icon:    Wrench,
    classes: "bg-blue-50 border-blue-200 text-blue-700",
    iconCls: "text-blue-500",
  },
  no_data: {
    icon:    HelpCircle,
    classes: "bg-slate-50 border-slate-200 text-slate-600",
    iconCls: "text-slate-400",
  },
}

export function RestorationBadge({ restorationInfo }) {
  if (!restorationInfo) return null

  const { type, label, isOverdue } = restorationInfo
  const config = CONFIG[type] ?? CONFIG.no_data
  const Icon   = config.icon

  return (
    <div className={cn(
      "flex items-start gap-2 px-3 py-2 rounded-lg border text-xs",
      config.classes,
      isOverdue && "border-red-300 bg-red-100"
    )}>
      <Icon className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", config.iconCls)} />
      <span className="leading-relaxed">
        {isOverdue
          ? `Power is overdue - was expected to return by ${restorationInfo.time}`
          : label
        }
      </span>
    </div>
  )
}
