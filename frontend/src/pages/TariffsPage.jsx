import { useState }             from "react"
import { ConsumerTypeSelector } from "@/components/modules/tariff/ConsumerTypeSelector"
import { RateSlabTable }        from "@/components/modules/tariff/RateSlabTable"
import { BillCalculator }       from "@/components/modules/tariff/BillCalculator"
import { RateHistory }          from "@/components/modules/tariff/RateHistory"
import { Separator }            from "@/components/ui/separator"
import { useTranslation }       from "react-i18next"

export default function TariffsPage() {
  const { t }                           = useTranslation()
  const [consumerType, setConsumerType] = useState("residential")
  const [calcUnits, setCalcUnits]       = useState(null)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("tariffs.title", "Electricity Tariff Rates")}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          NEPRA-approved rates for Islamabad · Calculate your estimated bill
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          Select consumer type
        </h2>
        <ConsumerTypeSelector value={consumerType} onChange={setConsumerType} />
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Current rates</h2>
            <span className="text-xs text-slate-400">Per unit (PKR)</span>
          </div>
          <RateSlabTable consumerType={consumerType} highlightUnits={calcUnits} />
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-semibold text-slate-800">Bill calculator</h2>
          <BillCalculator consumerType={consumerType} onUnitsChange={setCalcUnits} />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Rate history</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Past NEPRA rate revisions for {consumerType} consumers
          </p>
        </div>
        <RateHistory consumerType={consumerType} />
      </div>

    </div>
  )
}
