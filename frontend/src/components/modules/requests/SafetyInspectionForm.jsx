import { CitizenInfoFields } from "./CitizenInfoFields"
import { Label }             from "@/components/ui/label"
import { Textarea }          from "@/components/ui/textarea"
import { cn }                from "@/lib/utils"
import {
  Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue,
}                            from "@/components/ui/select"

const URGENCY_CONFIG = {
  critical: { label: "Critical - immediate danger",   classes: "border-red-400    bg-red-50    text-red-700"    },
  high:     { label: "High - dangerous but stable",   classes: "border-orange-400 bg-orange-50 text-orange-700" },
  medium:   { label: "Medium - needs attention soon", classes: "border-amber-400  bg-amber-50  text-amber-700"  },
  low:      { label: "Low - minor concern",           classes: "border-slate-300  bg-slate-50  text-slate-700"  },
}

export function SafetyInspectionForm({ values, onChange, errors = {} }) {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
        <p className="text-sm font-semibold text-red-800">
          Emergency? Call IESCO directly
        </p>
        <p className="text-sm text-red-700 mt-0.5">
          For life-threatening electrical emergencies dial{" "}
          <span className="font-mono font-bold">051-9252000</span> or{" "}
          <span className="font-mono font-bold">118</span> (IESCO helpline).
          This form is for non-emergency inspections.
        </p>
      </div>

      <CitizenInfoFields values={values} onChange={onChange} errors={errors} />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Hazard details
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type of hazard <span className="text-red-500">*</span></Label>
            <Select
              value={values.hazard_type || ""}
              onValueChange={(v) => onChange("hazard_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hazard type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sparking">Sparking or arcing wires</SelectItem>
                <SelectItem value="overheating">Overheating meter or panel</SelectItem>
                <SelectItem value="exposed_wires">Exposed / bare electrical wires</SelectItem>
                <SelectItem value="tripping">Circuit breaker tripping repeatedly</SelectItem>
                <SelectItem value="transformer">Transformer issue on street</SelectItem>
                <SelectItem value="other">Other electrical hazard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Urgency level <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange("urgency", key)}
                  className={cn(
                    "text-left px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition",
                    values.urgency === key
                      ? cfg.classes
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  )}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">
              Describe the hazard <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="desc"
              placeholder="Describe what you are seeing, where it is, and how long it has been happening..."
              value={values.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              rows={4}
              className="resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-slate-400">
              Minimum 20 characters. Be as specific as possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
