import { useState }             from "react"
import { useTranslation }       from "react-i18next"
import { ActiveOutageBanner }   from "@/components/modules/schedule/ActiveOutageBanner"
import { SectorFilter }         from "@/components/modules/schedule/SectorFilter"
import { ScheduleTable }        from "@/components/modules/schedule/ScheduleTable"
import { WeekView }             from "@/components/modules/schedule/WeekView"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CalendarDays, Clock }  from "lucide-react"
import { useRealtimeSchedules } from "@/hooks/useRealtimeSchedules"
import { SMSSubscribeForm }     from "@/components/alerts/SMSSubscribeForm"
import { StaleDataBadge }       from "@/components/pwa/StaleDataBadge"

export default function SchedulePage() {
  useRealtimeSchedules()
  const { t }               = useTranslation()
  const [sector, setSector] = useState(null)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("schedule.title")}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {t("schedule.subtitle")}
        </p>
      </div>

      <ActiveOutageBanner />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SectorFilter value={sector} onChange={setSector} />
        <StaleDataBadge lastUpdated={new Date().toISOString()} />
        {sector && (
          <button
            onClick={() => setSector(null)}
            className="text-sm text-iesco-teal hover:underline"
          >
            {t("schedule.clear")}
          </button>
        )}
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {t("schedule.today")}
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {t("schedule.thisWeek")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <ScheduleTable sector={sector} />
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <WeekView sector={sector} />
        </TabsContent>
      </Tabs>

      <div className="pt-4">
        <SMSSubscribeForm />
      </div>
    </div>
  )
}


