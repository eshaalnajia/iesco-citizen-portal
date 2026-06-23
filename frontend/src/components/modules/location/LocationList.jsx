import { useLocations }  from "@/hooks/useLocation"
import { LocationCard }  from "./LocationCard"
import { Skeleton }      from "@/components/ui/skeleton"
import { Building2 }     from "lucide-react"

export function LocationList({ search, areaType }) {
  const { data, isLoading, isError, isFetching } = useLocations({
    search:   search || undefined,
    areaType: areaType || undefined,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">Could not load locations. Please try again.</p>
      </div>
    )
  }

  const locations = data?.data ?? []
  const total     = data?.total ?? 0

  if (locations.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
        <p className="font-medium text-slate-600">No locations found</p>
        {search && (
          <p className="text-sm text-slate-400">
            No results for "{search}". Try a different search term.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {total} location{total !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
          {areaType && ` · ${areaType.replace("_", " ")}`}
          {isFetching && " · updating..."}
        </p>
      </div>

      {locations.map((loc) => (
        <LocationCard key={loc.id} location={loc} />
      ))}
    </div>
  )
}
