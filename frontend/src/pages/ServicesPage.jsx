import { useState, useDeferredValue } from "react"
import { useTranslation }             from "react-i18next"
import { SwipeLayout }                from "@/components/layout/SwipeLayout"
import { AreaSearch }                 from "@/components/modules/services/AreaSearch"
import { ProviderList }               from "@/components/modules/services/ProviderList"
import { Separator }                  from "@/components/ui/separator"
import { Zap, Wrench, Gauge, PlusCircle } from "lucide-react"

const CATEGORIES = [
  { value: "electrician",          labelKey: "electricians",  icon: Zap        },
  { value: "repair_centre",        labelKey: "repairCentres", icon: Wrench     },
  { value: "meter_agent",          labelKey: "meterAgents",   icon: Gauge      },
  { value: "new_connection_agent", labelKey: "newConnection", icon: PlusCircle },
]

export default function ServicesPage() {
  const { t }                       = useTranslation()
  const [areaSearch, setAreaSearch] = useState("")
  const deferredArea                = useDeferredValue(areaSearch)

  const slides = CATEGORIES.map((cat) => {
    const Icon = cat.icon
    return {
      content: (
        <div className="space-y-4 p-1">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Icon className="h-5 w-5 text-iesco-teal" />
            {t(`services.${cat.labelKey}`)}
          </h2>
          <ProviderList
            providerType={cat.value}
            area={deferredArea}
            search={undefined}
          />
        </div>
      ),
    }
  })

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("services.title", "Services Directory")}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {t("services.subtitle")}
        </p>
      </div>

      <AreaSearch value={areaSearch} onChange={setAreaSearch} />
      <Separator />

      <SwipeLayout slides={slides} />
    </div>
  )
}