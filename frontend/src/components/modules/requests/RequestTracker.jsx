import { useState }          from "react"
import { useTrackRequest, useConfirmRequest } from "@/hooks/useServiceRequest"
import { Input }             from "@/components/ui/input"
import { Button }            from "@/components/ui/button"
import { Loader2, Search,
         CheckCircle, Clock,
         XCircle, AlertCircle,
         HelpCircle }         from "lucide-react"

const STATUS_ICONS = {
  pending:                { icon: Clock,        cls: "text-slate-400"  },
  in_review:              { icon: AlertCircle,  cls: "text-blue-500"   },
  approved:               { icon: CheckCircle,  cls: "text-green-500"  },
  awaiting_confirmation:  { icon: HelpCircle,   cls: "text-amber-500"  },
  completed:              { icon: CheckCircle,  cls: "text-green-600"  },
  presumed_completed:     { icon: CheckCircle,  cls: "text-lime-600"   },
  rejected:               { icon: XCircle,      cls: "text-red-500"    },
  cancelled:              { icon: XCircle,      cls: "text-slate-400"  },
}

// Progress bar treats awaiting_confirmation/presumed_completed as
// equivalent to "approved" and "completed" respectively, since they're
// the same operational stage from the citizen's point of view --
// just with an extra confirmation step layered on top.
const STEPS = ["pending", "in_review", "approved", "completed"]

function stepIndexFor(status) {
  if (status === "awaiting_confirmation") return STEPS.indexOf("approved")
  if (status === "presumed_completed")    return STEPS.indexOf("completed")
  return STEPS.indexOf(status)
}

function ConfirmationBanner({ ticketNumber, onConfirmed }) {
  const { mutate, isPending, variables } = useConfirmRequest(ticketNumber)

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900 text-sm">Was this request completed?</p>
          <p className="text-xs text-amber-700 mt-0.5">
            It's been a while since your request was approved. Please let us know if the
            work has been completed so we can close it out.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={isPending}
          onClick={() => mutate(true, { onSuccess: onConfirmed })}
        >
          {isPending && variables === true
            ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            : null}
          Yes, it's done
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-amber-300 text-amber-800 hover:bg-amber-100"
          disabled={isPending}
          onClick={() => mutate(false, { onSuccess: onConfirmed })}
        >
          {isPending && variables === false
            ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            : null}
          Not yet
        </Button>
      </div>
    </div>
  )
}

export function RequestTracker() {
  const [input, setInput]       = useState("")
  const [ticket, setTicket]     = useState(null)
  const [justConfirmed, setJustConfirmed] = useState(null)

  const { data, isLoading, isError } = useTrackRequest(ticket)

  function handleTrack(e) {
    e.preventDefault()
    const cleaned = input.trim().toUpperCase()
    if (cleaned.startsWith("SR-")) {
      setJustConfirmed(null)
      setTicket(cleaned)
    }
  }

  const statusConfig = data ? (STATUS_ICONS[data.status] ?? STATUS_ICONS.pending) : null
  const Icon         = statusConfig?.icon
  const currentIdx   = data ? stepIndexFor(data.status) : -1

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

          {data.needs_confirmation && !justConfirmed && (
            <ConfirmationBanner
              ticketNumber={data.ticket_number}
              onConfirmed={(result) => setJustConfirmed(result)}
            />
          )}

          {justConfirmed && (
            <div className={`rounded-xl p-3 text-sm font-medium ${
              justConfirmed.completed
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}>
              {justConfirmed.message}
            </div>
          )}

          {!["rejected", "cancelled"].includes(data.status) && (
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => {
                const done = i <= currentIdx
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