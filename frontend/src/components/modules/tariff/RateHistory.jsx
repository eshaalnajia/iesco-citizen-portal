import { useTariffHistory }       from "@/hooks/useTariff"
import { Skeleton }                from "@/components/ui/skeleton"
import { Badge }                   from "@/components/ui/badge"
import { useState }                from "react"
import { ChevronDown, ChevronUp }  from "lucide-react"

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric", month: "long", day: "numeric",
  })
}

function RevisionCard({ revision, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0 bg-iesco-teal mt-0.5" />
          <div>
            <span className="text-sm font-medium text-slate-800">
              Effective {formatDate(revision.effective_from)}
            </span>
            <span className="ml-2 text-xs text-slate-400">
              {revision.slabs.length} slab{revision.slabs.length !== 1 ? "s" : ""}
            </span>
          </div>
          {revision.is_current && (
            <Badge variant="secondary" className="bg-iesco-teal/10 text-iesco-teal border-iesco-teal/20 text-xs">
              Current
            </Badge>
          )}
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
        }
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="text-left text-slate-400 font-medium py-2 px-4">Units</th>
                <th className="text-right text-slate-400 font-medium py-2 px-4">Peak (PKR/unit)</th>
                <th className="text-right text-slate-400 font-medium py-2 px-4">Off-peak</th>
                <th className="text-right text-slate-400 font-medium py-2 px-4">Fixed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {revision.slabs.map((slab, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2 px-4 text-slate-700 font-medium">
                    {slab.units_to ? `${slab.units_from}-${slab.units_to}` : `${slab.units_from}+`}
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-slate-600">{Number(slab.peak_rate).toFixed(2)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-600">{Number(slab.offpeak_rate).toFixed(2)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-500">{Number(slab.fixed_charge).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function RateHistory({ consumerType }) {
  const { data, isLoading } = useTariffHistory(consumerType)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  const revisions = data?.revisions ?? []

  if (revisions.length === 0) {
    return <p className="text-sm text-slate-400">No rate history available.</p>
  }

  return (
    <div className="space-y-2">
      {revisions.map((rev, i) => (
        <RevisionCard
          key={rev.effective_from}
          revision={rev}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  )
}
