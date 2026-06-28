import { CitizenInfoFields } from "./CitizenInfoFields"
import { Label }             from "@/components/ui/label"
import { Input }             from "@/components/ui/input"
import { Textarea }          from "@/components/ui/textarea"
import {
  Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue,
}                            from "@/components/ui/select"

export function EnergyAuditForm({ values, onChange, errors = {} }) {
  return (
    <div className="space-y-6">
      <CitizenInfoFields values={values} onChange={onChange} errors={errors} />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Audit information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Primary concern <span className="text-red-500">*</span></Label>
            <Select
              value={values.concern || ""}
              onValueChange={(v) => onChange("concern", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select concern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high_bills">My electricity bills are too high</SelectItem>
                <SelectItem value="efficiency">Want to improve energy efficiency</SelectItem>
                <SelectItem value="solar_feasibility">Exploring solar panel feasibility</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avg_bill">
              Average monthly bill (PKR) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="avg_bill"
              type="number"
              placeholder="e.g. 15000"
              value={values.avg_monthly_bill || ""}
              onChange={(e) => onChange("avg_monthly_bill", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sqft">
              Property size (sq ft){" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="sqft"
              type="number"
              placeholder="e.g. 1200"
              value={values.property_size_sqft || ""}
              onChange={(e) => onChange("property_size_sqft", e.target.value)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="appliances">
              Major appliances{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="appliances"
              placeholder="e.g. 2 ACs, refrigerator, geyser, washing machine"
              value={values.major_appliances_text || ""}
              onChange={(e) => onChange("major_appliances_text", e.target.value)}
            />
            <p className="text-xs text-slate-400">
              List the main appliances in your home or office
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
