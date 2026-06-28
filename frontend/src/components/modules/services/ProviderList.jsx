import { useTranslation }  from "react-i18next"
import { useProviders }    from "@/hooks/useServices"
import { ProviderCard }    from "./ProviderCard"
import { Skeleton }        from "@/components/ui/skeleton"
import { Wrench }          from "lucide-react"

export function ProviderList({ providerType, area, search }) {
  const { t } = useTranslation()
  const { data, isLoading, isError, isFetching } = useProviders({
    providerType,
    area:   area || undefined,
    search: search || undefined,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">Could not load providers. Please try again.</p>
      </div>
    )
  }

  const providers = data?.data ?? []
  const total     = data?.total ?? 0

  if (providers.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <Wrench className="h-10 w-10 text-slate-300 mx-auto" />
        <p className="font-medium text-slate-600">{t("services.noProviders", "No providers found")}</p>
        <p className="text-sm text-slate-400">
          {search
            ? t("services.noProvidersSearch", `No results for "${search}". Try a different search.`, { term: search })
            : area
            ? t("services.noProvidersArea", `No verified providers found in ${area}. Try removing the area filter.`, { area })
            : t("services.noProvidersDefault", "No verified providers available right now.")
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        {t("services.providersCount", `${total} provider${total !== 1 ? "s" : ""}`, { count: total })}
        {providerType && ` - ${providerType.replaceAll("_", " ")}`}
        {area && ` in ${area}`}
        {search && ` matching "${search}"`}
        {isFetching && ` - ${t("services.updating", "updating...")}`}
      </p>

      {providers.map((p) => (
        <ProviderCard key={p.id} provider={p} />
      ))}
    </div>
  )
}
