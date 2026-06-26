import { useState }       from "react"
import { useMutation }    from "@tanstack/react-query"
import { Button }         from "@/components/ui/button"
import { TriangleAlert, CheckCircle, Loader2 } from "lucide-react"
import api                from "@/services/api"

async function submitOutageReport({ feederId, lat, lng }) {
  const { data } = await api.post("/outage-reports/", {
    feeder_id: feederId,
    lat,
    lng,
  })
  return data
}

export function OutageReportButton({ feeder, userLocation }) {
  const [submitted, setSubmitted] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: submitOutageReport,
    onSuccess: () => setSubmitted(true),
  })

  if (["fault", "load_shedding", "no_data"].includes(feeder.status)) {
    return null
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Report received - thank you. 3 reports from this area will update the map.</span>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
      disabled={isPending}
      onClick={() => mutate({
        feederId: feeder.id,
        lat:      userLocation?.lat ?? null,
        lng:      userLocation?.lng ?? null,
      })}
    >
      {isPending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        : <TriangleAlert className="h-3.5 w-3.5 mr-1.5" />
      }
      Report power outage in this area
    </Button>
  )
}
