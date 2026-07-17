import { useState }             from "react"
import { useTranslation }       from "react-i18next"
import { SwipeLayout }          from "@/components/layout/SwipeLayout"
import { ActiveOutageBanner }   from "@/components/modules/schedule/ActiveOutageBanner"
import { SectorFilter }         from "@/components/modules/schedule/SectorFilter"
import { ScheduleTable }        from "@/components/modules/schedule/ScheduleTable"
import { WeekView }             from "@/components/modules/schedule/WeekView"
import { CalendarDays, Clock, Bell } from "lucide-react"
import { useRealtimeSchedules } from "@/hooks/useRealtimeSchedules"
import { SMSSubscribeForm }     from "@/components/alerts/SMSSubscribeForm"
import { StaleDataBadge }       from "@/components/pwa/StaleDataBadge"
import { useLastSync }          from "@/hooks/useLastSync"

export default function SchedulePage() {
  useRealtimeSchedules()
  const { t }               = useTranslation()
  const [sector, setSector] = useState(null)
  const lastSync            = useLastSync()

  const slides = [
    {
      label:   "Today",
      content: (
        <div className="space-y-4 p-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-iesco-teal" />
              {t("schedule.today")}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Swipe left for weekly view →
            </p>
          </div>
          <ActiveOutageBanner />
          <ScheduleTable sector={sector} />
        </div>
      ),
    },
    {
      label:   "This Week",
      content: (
        <div className="space-y-4 p-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-iesco-teal" />
              {t("schedule.thisWeek")}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              ← Swipe right for today's schedule
            </p>
          </div>
          <WeekView sector={sector} />
        </div>
      ),
    },
    {
      label:   "Alerts",
      content: (
        <div className="space-y-4 p-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-iesco-teal" />
              SMS Alerts
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Get notified when power goes out in your area
            </p>
          </div>
          <SMSSubscribeForm />
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("schedule.title")}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {t("schedule.subtitle")}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SectorFilter value={sector} onChange={setSector} />
        <StaleDataBadge lastUpdated={lastSync} />
        {sector && (
          <button
            onClick={() => setSector(null)}
            className="text-sm text-iesco-teal hover:underline"
          >
            {t("schedule.clear")}
          </button>
        )}
      </div>

      <SwipeLayout slides={slides} />
    </div>
  )
}