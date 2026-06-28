import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CitizenInfoFields({ values, onChange, errors = {} }) {
  function field(name) {
    return {
      value:    values[name] || "",
      onChange: (e) => onChange(name, e.target.value),
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
        Your information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="full_name">Full name <span className="text-red-500">*</span></Label>
          <Input
            id="full_name"
            placeholder="As on your CNIC"
            {...field("full_name")}
          />
          {errors.full_name && (
            <p className="text-xs text-red-500">{errors.full_name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cnic">CNIC <span className="text-red-500">*</span></Label>
          <Input
            id="cnic"
            placeholder="XXXXX-XXXXXXX-X"
            {...field("cnic")}
            className="font-mono"
          />
          {errors.cnic && (
            <p className="text-xs text-red-500">{errors.cnic}</p>
          )}
          <p className="text-xs text-slate-400">13 digits as printed on your card</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number <span className="text-red-500">*</span></Label>
          <Input
            id="phone"
            type="tel"
            placeholder="03XXXXXXXXX"
            {...field("phone")}
            className="font-mono"
          />
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="email">
            Email address <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...field("email")}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="address">Full address <span className="text-red-500">*</span></Label>
          <Textarea
            id="address"
            placeholder="House/flat number, street, sector, Islamabad"
            {...field("address")}
            rows={2}
            className="resize-none"
          />
          {errors.address && (
            <p className="text-xs text-red-500">{errors.address}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sector">
            Sector / area <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="sector"
            placeholder="e.g. G-11, Bahria Town"
            {...field("sector")}
          />
        </div>
      </div>
    </div>
  )
}
