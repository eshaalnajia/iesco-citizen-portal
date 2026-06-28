import { CitizenInfoFields } from "./CitizenInfoFields"
import { Label }             from "@/components/ui/label"
import { Input }             from "@/components/ui/input"
import {
  Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue,
}                            from "@/components/ui/select"

export function MeterChangeForm({ values, onChange, errors = {} }) {
  return (
    <div className="space-y-6">
      <CitizenInfoFields values={values} onChange={onChange} errors={errors} />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Meter details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="meter_num">
              Meter number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="meter_num"
              placeholder="Printed on your meter"
              value={values.meter_number || ""}
              onChange={(e) => onChange("meter_number", e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ref">IESCO reference number</Label>
            <Input
              id="ref"
              placeholder="14-digit number from bill"
              value={values.reference_number || ""}
              onChange={(e) => onChange("reference_number", e.target.value)}
              className="font-mono"
              maxLength={14}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>
              Reason for change <span className="text-red-500">*</span>
            </Label>
            <Select
              value={values.issue_type || ""}
              onValueChange={(v) => onChange("issue_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="burnt">Meter is burnt / destroyed</SelectItem>
                <SelectItem value="faulty_reading">Meter giving wrong readings</SelectItem>
                <SelectItem value="damaged">Meter physically damaged</SelectItem>
                <SelectItem value="theft">Meter stolen or tampered</SelectItem>
                <SelectItem value="upgrade">Upgrade to digital/smart meter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reading">
              Current meter reading{" "}
              <span className="text-slate-400 font-normal">(if readable)</span>
            </Label>
            <Input
              id="reading"
              type="number"
              min="0"
              placeholder="e.g. 14520"
              value={values.current_reading || ""}
              onChange={(e) => onChange("current_reading", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
