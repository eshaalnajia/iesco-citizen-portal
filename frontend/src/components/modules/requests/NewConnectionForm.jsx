import { useState }           from "react"
import { CitizenInfoFields }  from "./CitizenInfoFields"
import { Label }              from "@/components/ui/label"
import { Input }              from "@/components/ui/input"
import {
  Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue,
}                             from "@/components/ui/select"

export function NewConnectionForm({ values, onChange, errors = {} }) {
  return (
    <div className="space-y-6">
      <CitizenInfoFields values={values} onChange={onChange} errors={errors} />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Connection details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Property type <span className="text-red-500">*</span></Label>
            <Select
              value={values.property_type || ""}
              onValueChange={(v) => onChange("property_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential (home/flat)</SelectItem>
                <SelectItem value="commercial">Commercial (shop/office)</SelectItem>
                <SelectItem value="industrial">Industrial (factory/warehouse)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="load_kw">
              Estimated load (kW) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="load_kw"
              type="number"
              min="0.5"
              max="500"
              step="0.5"
              placeholder="e.g. 5"
              value={values.load_required_kw || ""}
              onChange={(e) => onChange("load_required_kw", e.target.value)}
            />
            <p className="text-xs text-slate-400">
              Typical home: 5-10 kW - Shop: 10-20 kW
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plot">
              Plot / property number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="plot"
              placeholder="e.g. Plot 14, Street 5"
              value={values.plot_number || ""}
              onChange={(e) => onChange("plot_number", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Ownership document type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={values.document_type || ""}
              onValueChange={(v) => onChange("document_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ownership_deed">Ownership deed</SelectItem>
                <SelectItem value="lease_agreement">Lease / rental agreement</SelectItem>
                <SelectItem value="noc">NOC from owner</SelectItem>
                <SelectItem value="allotment_letter">Allotment letter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
