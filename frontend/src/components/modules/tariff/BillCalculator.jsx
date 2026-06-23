import { useState, useId }    from "react"
import { useBillCalculation } from "@/hooks/useTariff"
import { Input }              from "@/components/ui/input"
import { Label }              from "@/components/ui/label"
import { Skeleton }           from "@/components/ui/skeleton"
import { Separator }          from "@/components/ui/separator"
import { Calculator, Zap }    from "lucide-react"

function formatPKR(amount) {
  if (amount == null) return "-"
  return new Intl.NumberFormat("en-PK", {
    style:                "currency",
    currency:             "PKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function BillRow({ label, amount, muted = false, bold = false }) {
  return (
    <div className={`flex justify-between items-baseline py-1.5 ${muted ? "text-slate-400" : "text-slate-700"}`}>
      <span className={`text-sm ${bold ? "font-semibold text-slate-900" : ""}`}>{label}</span>
      <span className={`text-sm font-mono ${bold ? "font-bold text-slate-900" : ""} ${muted ? "text-slate-400" : ""}`}>
        {typeof amount === "number" ? formatPKR(amount) : amount}
      </span>
    </div>
  )
}

function SlabBreakdownRow({ slab }) {
  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-700">{slab.slab_label}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {slab.units_in_slab} unit{slab.units_in_slab !== 1 ? "s" : ""} · {slab.peak_units} peak + {slab.offpeak_units} off-peak
          </p>
        </div>
        <span className="text-sm font-mono font-medium text-slate-700">{formatPKR(slab.slab_total)}</span>
      </div>
    </div>
  )
}

export function BillCalculator({ consumerType, onUnitsChange }) {
  const inputId               = useId()
  const [units, setUnits]     = useState("")
  const [peakPct, setPeakPct] = useState(30)
  const [showSlab, setShowSlab] = useState(false)

  const parsedUnits = parseInt(units, 10)
  const validUnits  = !isNaN(parsedUnits) && parsedUnits > 0

  const { data, isLoading } = useBillCalculation(
    parsedUnits,
    consumerType,
    peakPct / 100,
    validUnits
  )

  function handleUnitsChange(e) {
    const raw = e.target.value.replace(/[^0-9]/g, "")
    setUnits(raw); const parsed = parseInt(raw, 10); if (onUnitsChange) { onUnitsChange(isNaN(parsed) ? null : parsed) }
  }

  return (
    <div className="space-y-5">

      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          Units consumed this month
        </Label>
        <div className="relative">
          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id={inputId}
            type="text"
            inputMode="numeric"
            placeholder="e.g. 350"
            value={units}
            onChange={handleUnitsChange}
            className="pl-9 text-lg font-mono"
            maxLength={6}
          />
        </div>
        <p className="text-xs text-slate-400">
          Read the number of units from your last electricity meter reading
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium text-slate-700">
            Estimated peak hour usage
          </Label>
          <span className="text-sm font-mono font-semibold text-iesco-teal">{peakPct}%</span>
        </div>
        <input
          type="range"
          value={peakPct}
          onChange={(e) => setPeakPct(Number(e.target.value))}
          min={0}
          max={100}
          step={5}
          className="w-full accent-iesco-teal"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>All off-peak</span>
          <span>Half peak</span>
          <span>All peak</span>
        </div>
        <p className="text-xs text-slate-400">
          Peak hours are typically 5 PM - 11 PM. If you mostly use appliances in the evening, increase this.
        </p>
      </div>

      {!validUnits && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center text-slate-400">
          <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Enter units above to see your estimated bill</p>
        </div>
      )}

      {validUnits && isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      )}

      {validUnits && data && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowSlab((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <span>Slab breakdown - {data.units_consumed} units</span>
            <span className="text-xs text-slate-400">{showSlab ? "Hide" : "Show"}</span>
          </button>

          {showSlab && (
            <div className="px-4 py-2">
              {data.slab_breakdown.map((slab, i) => (
                <SlabBreakdownRow key={i} slab={slab} />
              ))}
            </div>
          )}

          <div className="px-4 py-3 space-y-0.5">
            <BillRow label="Energy charges"                          amount={data.energy_charges} />
            <BillRow label="Fixed monthly charge"                    amount={data.fixed_charge}   muted={data.fixed_charge === 0} />
            <BillRow label="Fuel cost surcharge (FC)"                amount={data.fc_surcharge}   muted={data.fc_surcharge === 0} />
            <BillRow label="Tariff rationalisation surcharge (TR)"   amount={data.tr_surcharge}   muted={data.tr_surcharge === 0} />

            <Separator className="my-2" />

            <BillRow label="Subtotal" amount={data.subtotal} />
            <BillRow label={`GST (${(data.gst_rate * 100).toFixed(0)}%)`} amount={data.gst_amount} />

            <Separator className="my-2" />

            <BillRow label="Total payable" amount={data.total_payable} bold />

            <div className="pt-2 pb-1">
              <p className="text-xs text-slate-400">
                Average rate: <span className="font-mono font-medium text-slate-600">PKR {data.average_rate?.toFixed(2)} / unit</span>
                {" · "}{peakPct}% peak consumption assumed
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
