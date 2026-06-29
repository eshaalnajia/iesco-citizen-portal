import { useState }    from "react"
import { useMutation } from "@tanstack/react-query"
import { Input }       from "@/components/ui/input"
import { Button }      from "@/components/ui/button"
import { Label }       from "@/components/ui/label"
import {
  Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue,
}                      from "@/components/ui/select"
import { Bell, CheckCircle, Loader2 } from "lucide-react"
import api             from "@/services/api"

async function subscribeToAlerts({ phone, feederId, sector }) {
  const { data } = await api.post("/sms/subscribe", {
    phone,
    feeder_id: feederId || undefined,
    sector:    sector   || undefined,
  })
  return data
}

const SECTORS = [
  "G-11", "G-10", "G-9", "F-10", "F-8", "F-7", "F-6",
  "I-8", "I-9", "I-10", "E-7", "E-11", "H-8", "H-9",
  "Bahria Town", "DHA", "Wah Cantonment", "Taxila",
]

export function SMSSubscribeForm({ feeders = [] }) {
  const [phone, setPhone]   = useState("")
  const [sector, setSector] = useState("")
  const [done, setDone]     = useState(false)

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: subscribeToAlerts,
    onSuccess:  () => setDone(true),
  })

  if (done) {
    return (
      <div className="flex items-start gap-3 bg-green-50 border
                      border-green-200 rounded-xl p-4">
        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-green-800">Alerts activated</p>
          <p className="text-sm text-green-700 mt-0.5">
            You will receive an SMS when power goes out in your area.
            Reply <span className="font-mono font-bold">STOP</span> to any message to unsubscribe.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-iesco-teal" />
        <h3 className="font-semibold text-slate-800">Get outage SMS alerts</h3>
      </div>

      <p className="text-sm text-slate-500">
        Enter your mobile number to receive an SMS the moment power goes out
        in your area. Free service - reply STOP to cancel anytime.
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="alert-phone">Mobile number</Label>
          <Input
            id="alert-phone"
            type="tel"
            placeholder="03XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Your area</Label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger>
              <SelectValue placeholder="Select your sector" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isError && (
          <p className="text-sm text-red-600">
            {error?.response?.data?.detail || "Could not subscribe. Try again."}
          </p>
        )}

        <Button
          className="w-full"
          onClick={() => mutate({ phone, sector })}
          disabled={!phone || !sector || isPending}
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subscribing...</>
            : <><Bell className="h-4 w-4 mr-2" />Subscribe to alerts</>
          }
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        A confirmation SMS will be sent to verify your number.
        Standard messaging rates from your carrier may apply.
      </p>
    </div>
  )
}
