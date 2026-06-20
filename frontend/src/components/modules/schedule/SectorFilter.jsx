import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin } from "lucide-react"

const SECTORS = [
  "All areas",
  "G-11", "G-9", "G-10",
  "F-10", "F-8", "F-7", "F-6",
  "I-8", "I-9", "I-10",
  "E-7", "E-8", "E-9",
  "H-8", "H-9",
  "Bahria Town",
  "DHA",
  "Wah Cantonment",
  "Taxila",
]

export function SectorFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
      <Select
        value={value ?? "all"}
        onValueChange={(v) => onChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-52">
          <SelectValue>
            {value ?? "All areas"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SECTORS.map((s) => (
            <SelectItem key={s} value={s === "All areas" ? "all" : s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
