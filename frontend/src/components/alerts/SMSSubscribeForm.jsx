import { useState }    from "react"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
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
  const { t }           = useTranslation()
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
          <p className="font-medium text-green-800">{t("alerts.subscribed")}</p>
          <p className="text-sm text-green-700 mt-0.5">
            {t("alerts.subscribedDetail")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-iesco-teal" />
        <h3 className="font-semibold text-slate-800">{t("alerts.title")}</h3>
      </div>

      <p className="text-sm text-slate-500">
        {t("alerts.subtitle")} {t("alerts.freeService")}
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="alert-phone">{t("alerts.phoneLabel")}</Label>
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
          <Label>{t("alerts.areaLabel")}</Label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger>
              <SelectValue placeholder={t("schedule.selectArea")} />
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
            {error?.response?.data?.detail || t("common.error")}
          </p>
        )}

        <Button
          className="w-full"
          onClick={() => mutate({ phone, sector })}
          disabled={!phone || !sector || isPending}
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("alerts.subscribing") || "..."}</>
            : <><Bell className="h-4 w-4 mr-2" />{t("alerts.subscribe")}</>
          }
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        {t("alerts.freeService")}
      </p>
    </div>
  )
}
