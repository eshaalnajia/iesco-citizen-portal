import { useState, useDeferredValue } from "react"
import { useTranslation }             from "react-i18next"
import { ProviderTypeFilter }         from "@/components/modules/services/ProviderTypeFilter"
import { AreaSearch }                 from "@/components/modules/services/AreaSearch"
import { ProviderList }               from "@/components/modules/services/ProviderList"
import { Separator }                  from "@/components/ui/separator"

export default function ServicesPage() {
  const { t }                         = useTranslation()
  const [providerType, setType]       = useState(null)
  const [areaSearch, setAreaSearch]   = useState("")
  const deferredArea                  = useDeferredValue(areaSearch)

  function handleTypeChange(type) {
    setType(type)
    setAreaSearch("")
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("services.title", "Services Directory")}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          IESCO-verified electricians, repair centres, and agents across Islamabad
        </p>
      </div>

      <ProviderTypeFilter value={providerType} onChange={handleTypeChange} />

      <AreaSearch value={areaSearch} onChange={setAreaSearch} />

      <Separator />

      <ProviderList
        providerType={providerType}
        area={deferredArea}
        search={undefined}
      />

    </div>
  )
}
