import { useRef }              from "react"
import { Input }               from "@/components/ui/input"
import { Search, X }           from "lucide-react"

export function LocationSearch({ value, onChange }) {
  const inputRef = useRef(null)

  function handleClear() {
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2
                         h-4 w-4 text-slate-400 pointer-events-none" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search area, sector, or town..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2
                     text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
