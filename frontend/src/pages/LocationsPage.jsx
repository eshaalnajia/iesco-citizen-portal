import { useState, useEffect } from "react"
import { useTranslation }             from "react-i18next"
import { LocationSearch }             from "@/components/modules/location/LocationSearch"
import { AreaTypeTabs }               from "@/components/modules/location/AreaTypeTabs"
import { LocationList }               from "@/components/modules/location/LocationList"
import { NearestOffices }             from "@/components/modules/location/NearestOffices"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MapPin, List }               from "lucide-react"

export default function LocationsPage() {
  const { t }                       = useTranslation()
  const [search, setSearch]         = useState("")
  const [areaType, setAreaType]     = useState(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  function handleSearch(value) {
    setSearch(value)
    if (value) setAreaType(null)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("locations.title", "Location Directory")}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {t("locations.subtitle")}
        </p>
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory" className="flex items-center gap-1.5">
            <List className="h-3.5 w-3.5" />
            {t("locations.directory")}
          </TabsTrigger>
          <TabsTrigger value="nearest" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {t("locations.nearMe")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4 mt-4">

          <LocationSearch value={search} onChange={handleSearch} />

          {!search && (
            <AreaTypeTabs value={areaType} onChange={setAreaType} />
          )}

          <LocationList search={debouncedSearch} areaType={areaType} />

        </TabsContent>

        <TabsContent value="nearest" className="mt-4">
          <div className="space-y-2 mb-4">
            <p className="text-sm text-slate-600">
              {t("locations.findNearest")}
            </p>
            <p className="text-xs text-slate-400">
            {t("locations.locationDenied")}
            </p>
          </div>
          <NearestOffices />
        </TabsContent>

      </Tabs>

    </div>
  )
}

