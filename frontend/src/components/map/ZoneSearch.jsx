import { useState, useRef, useEffect }  from "react"
import { useLocations }                  from "@/hooks/useLocation"
import { Search, X }                     from "lucide-react"
import { cn }                            from "@/lib/utils"
import { FEEDER_ZOOM }                   from "@/lib/mapConstants"

export function ZoneSearch({ map }) {
  const [query, setQuery]       = useState("")
  const [open, setOpen]         = useState(false)
  const inputRef                = useRef(null)
  const containerRef            = useRef(null)

  const { data } = useLocations({
    search: query.length >= 2 ? query : undefined,
  })

  const results = (data?.data ?? []).slice(0, 6)

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleSelect(location) {
    if (!map || !location.lat || !location.lng) return
    map.flyTo({
      center: [parseFloat(location.lng), parseFloat(location.lat)],
      zoom:   FEEDER_ZOOM,
      speed:  1.2,
    })
    setQuery(location.name)
    setOpen(false)
  }

  function handleClear() {
    setQuery("")
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-72"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search area or sector..."
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md focus:outline-none focus:ring-2 focus:ring-iesco-teal/40 focus:border-iesco-teal placeholder:text-slate-400"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          {results.map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center justify-between gap-2"
            >
              <span className="font-medium text-slate-800">{loc.name}</span>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {loc.area_type?.replace("_", " ")}
                {loc.feeders?.status && (
                  <span className={cn(
                    "ml-2 inline-block w-1.5 h-1.5 rounded-full",
                    loc.feeders.status === "on"       ? "bg-green-500" :
                    loc.feeders.status === "fault"    ? "bg-red-500"   :
                    "bg-orange-500"
                  )} />
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl px-4 py-3 text-sm text-slate-500">
          No areas found for "{query}"
        </div>
      )}
    </div>
  )
}




