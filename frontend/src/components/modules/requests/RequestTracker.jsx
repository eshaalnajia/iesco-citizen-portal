import { useState }          from "react"
import { useTrackRequest }   from "@/hooks/useServiceRequest"
import { Input }             from "@/components/ui/input"
import { Button }            from "@/components/ui/button"
import { Loader2, Search,
         CheckCircle, Clock,
         XCircle, AlertCircle } from "lucide-react"

const STATUS_ICONS = {
  pending:    { icon: Clock,        cls: "text-slate-400"  },
  in_review:  { icon: AlertCircle,  cls: "text-blue-500"   },
  approved:   { icon: CheckCircle,  cls: "text-green-500"  },
  completed:  { icon: CheckCircle,  cls: "text-green-600"  },
  rejected:   { icon: XCircle,      cls: "text-red-500"    },
  cancelled:  { icon: XCircle,      cls: "text-slate-400"  },
}

const STEPS = ["pending", "in_review", "approved", "completed"]

export function RequestTracker() {
  const [input, setInput]       = useState("")
  const [ticket, setTicket]     = useState(null)

  const { data, isLoading, isError } = useTrackRequest(ticket)

  function handleTrack(e) {
    e.preventDefault()
    const cleaned = input.trim().toUpperCase()
    if (cleaned.startsWith("SR-")) setTicket(cleaned)
  }

  const statusConfig = data ? (STATUS_ICONS[data.status] ?? STATUS_ICONS.pending) : null
  const Icon         = statusConfig?.icon

  return (
    <div className="space-y-4">
      <form onSubmit={handleTrack} className="flex gap-2">
        <Input
          placeholder="SR-YYYYMMDD-XXXX"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="font-mono"
        />
        <Button type="submit" variant="outline" disabled={isLoading}>
          {isLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Search className="h-4 w-4" />
          }
        </Button>
      </form>

      {isError && (
        <p className="text-sm text-red-600">
          Ticket not found. Check the ticket number from your submission.
        </p>
      )}

      {data && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            {Icon && <Icon className={`h-6 w-6 flex-shrink-0 ${statusConfig.cls}`} />}
            <div>
              <p className="font-mono text-sm text-slate-500">{data.ticket_number}</p>
              <p className="font-bold text-slate-900 mt-0.5">
                {data.request_type?.replaceAll("_", " ")}
              </p>
              <p className={`text-sm font-medium mt-1 ${statusConfig?.cls}`}>
                {data.status_label}
              </p>
            </div>
          </div>

          {!["rejected", "cancelled"].includes(data.status) && (
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => {
                const currentIdx = STEPS.indexOf(data.status)
                const done       = i <= currentIdx
                return (
                  <div key={step} className="flex items-center gap-1 flex-1">
                    <div className={`h-2 rounded-full flex-1 ${done ? "bg-iesco-teal" : "bg-slate-100"}`} />
                    {i < STEPS.length - 1 && (
                      <div className={`h-2 w-2 rounded-full ${done ? "bg-iesco-teal" : "bg-slate-100"}`} />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="space-y-2 text-sm">
            {[
              { label: "Name",           value: data.full_name },
              { label: "Address",        value: data.address },
              { label: "Submitted",      value: data.created_at
                  ? new Date(data.created_at).toLocaleDateString("en-PK", {
                      day: "numeric", month: "long", year: "numeric",
                    })
                  : "-"
              },
              { label: "Scheduled visit", value: data.scheduled_date || "Not yet scheduled" },
              { label: "IESCO notes",    value: data.admin_notes, muted: !data.admin_notes },
            ].map(({ label, value, muted }) => value && (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-slate-500 flex-shrink-0">{label}</span>
                <span className={`text-right ${muted ? "text-slate-400 italic" : "text-slate-800"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
