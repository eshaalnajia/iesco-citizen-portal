import { useRef }          from "react"
import { useTranslation }  from "react-i18next"
import { Input }           from "@/components/ui/input"
import { Search, X }       from "lucide-react"
import { useServiceAreas } from "@/hooks/useServices"

export function AreaSearch({ value, onChange }) {
  const { t }                 = useTranslation()
  const inputRef              = useRef(null)
  const { data: areaData }    = useServiceAreas()
  const areas                 = areaData?.areas ?? []

  function handleClear() {
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2
                           h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={t("services.areaPlaceholder", "Search by area...")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!value && areas.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-nowrap">
          {areas.slice(0, 8).map(({ area, count }) => (
            <button
              key={area}
              onClick={() => onChange(area)}
              className="flex-shrink-0 text-xs bg-slate-100 text-slate-600
                         hover:bg-slate-200 px-2.5 py-1 rounded-full transition"
            >
              {area}
              <span className="ml-1 text-slate-400">({count})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
