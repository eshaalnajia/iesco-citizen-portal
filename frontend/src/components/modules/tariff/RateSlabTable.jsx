import { cn }                from "@/lib/utils"
import { useCurrentTariffs } from "@/hooks/useTariff"
import { Skeleton }          from "@/components/ui/skeleton"
import { Badge }             from "@/components/ui/badge"
import { InfoIcon }          from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function formatPKR(amount) {
  return `PKR ${Number(amount).toFixed(2)}`
}

function unitRangeLabel(slab) {
  return slab.units_to
    ? `${slab.units_from} - ${slab.units_to} units`
    : `${slab.units_from}+ units`
}

function UsageBadge() {
  return (
    <Badge variant="secondary" className="text-[10px] bg-iesco-teal/10 text-iesco-teal border-iesco-teal/20 font-medium">
      Your usage
    </Badge>
  )
}

// Desktop / tablet row (table layout, shown md and up)
function SlabRow({ slab, isHighlighted }) {
  return (
    <tr className={cn(
      "border-b border-slate-100 transition-colors",
      isHighlighted ? "bg-iesco-teal/5" : "hover:bg-slate-50"
    )}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">
            {unitRangeLabel(slab)}
          </span>
          {isHighlighted && <UsageBadge />}
        </div>
      </td>
      <td className="py-3 px-4 text-sm font-mono text-slate-700">{formatPKR(slab.peak_rate)}</td>
      <td className="py-3 px-4 text-sm font-mono text-slate-700">{formatPKR(slab.offpeak_rate)}</td>
      <td className="py-3 px-4 text-sm font-mono text-slate-500">{formatPKR(slab.fixed_charge)}</td>
    </tr>
  )
}

// Mobile card (stacked layout, shown below md)
function SlabCard({ slab, isHighlighted }) {
  return (
    <div className={cn(
      "p-4 border-b border-slate-100",
      isHighlighted ? "bg-iesco-teal/5" : ""
    )}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-sm font-semibold text-slate-800">
          {unitRangeLabel(slab)}
        </span>
        {isHighlighted && <UsageBadge />}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-400 uppercase tracking-wide mb-1">Peak</p>
          <p className="font-mono text-slate-700">{formatPKR(slab.peak_rate)}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wide mb-1">Off-peak</p>
          <p className="font-mono text-slate-700">{formatPKR(slab.offpeak_rate)}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wide mb-1">Fixed</p>
          <p className="font-mono text-slate-500">{formatPKR(slab.fixed_charge)}</p>
        </div>
      </div>
    </div>
  )
}

export function RateSlabTable({ consumerType, highlightUnits = null }) {
  const { data, isLoading, isError } = useCurrentTariffs(consumerType)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-slate-500 py-4">Could not load tariff rates. Please try again.</p>
  }

  const slabs = data?.data ?? []

  function findHighlightedSlab(units) {
    if (!units || units <= 0) return null
    return slabs.find((s) =>
      units >= s.units_from &&
      (s.units_to === null || units <= s.units_to)
    )?.id
  }

  const highlightedId = findHighlightedSlab(highlightUnits)

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      {/* Mobile: stacked cards (below md breakpoint) */}
      <div className="md:hidden">
        {slabs.map((slab) => (
          <SlabCard
            key={slab.id}
            slab={slab}
            isHighlighted={slab.id === highlightedId}
          />
        ))}
      </div>

      {/* Desktop / tablet: table (md and up) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">Unit range</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">
                <div className="flex items-center gap-1">
                  Peak rate
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><InfoIcon className="h-3 w-3 text-slate-400" /></TooltipTrigger>
                      <TooltipContent><p className="text-xs">Usually 5 PM - 11 PM</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">
                <div className="flex items-center gap-1">
                  Off-peak rate
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><InfoIcon className="h-3 w-3 text-slate-400" /></TooltipTrigger>
                      <TooltipContent><p className="text-xs">11 PM - 5 PM next day</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">Fixed charge / month</th>
            </tr>
          </thead>
          <tbody>
            {slabs.map((slab) => (
              <SlabRow
                key={slab.id}
                slab={slab}
                isHighlighted={slab.id === highlightedId}
              />
            ))}
          </tbody>
        </table>
      </div>

      {slabs.length > 0 && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Rates effective {data?.effective_from ?? "-"} &middot; Approved by NEPRA &middot; 17% GST applies to the total bill
          </p>
        </div>
      )}
    </div>
  )
}
