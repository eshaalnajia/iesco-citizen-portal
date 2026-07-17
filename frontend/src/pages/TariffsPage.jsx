import { useState }             from "react"
import { useTranslation }       from "react-i18next"
import { SwipeLayout }          from "@/components/layout/SwipeLayout"
import { ConsumerTypeSelector } from "@/components/modules/tariff/ConsumerTypeSelector"
import { RateSlabTable }        from "@/components/modules/tariff/RateSlabTable"
import { BillCalculator }       from "@/components/modules/tariff/BillCalculator"
import { RateHistory }          from "@/components/modules/tariff/RateHistory"

export default function TariffsPage() {
  const { t }                           = useTranslation()
  const [consumerType, setConsumerType] = useState("residential")
  const [calcUnits, setCalcUnits]       = useState(null)

  const slides = [
    {
      content: (
        <div className="space-y-3 p-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">{t("tariffs.currentRates")}</h2>
            <span className="text-xs text-slate-400">{t("tariffs.perUnit")}</span>
          </div>
          <RateSlabTable consumerType={consumerType} highlightUnits={calcUnits} />
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-3 p-1">
          <h2 className="text-base font-semibold text-slate-800">{t("tariffs.calculator")}</h2>
          <BillCalculator consumerType={consumerType} onUnitsChange={setCalcUnits} />
        </div>
      ),
    },
    {
      content: (
        <div className="space-y-3 p-1">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{t("tariffs.rateHistory")}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t("tariffs.effectiveFrom", { date: consumerType })}
            </p>
          </div>
          <RateHistory consumerType={consumerType} />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("tariffs.title", "Electricity Tariff Rates")}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Swipe to switch between consumer types
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          {t("tariffs.selectType")}
        </h2>
        <ConsumerTypeSelector value={consumerType} onChange={setConsumerType} />
      </div>

      <SwipeLayout slides={slides} />
    </div>
  )
}