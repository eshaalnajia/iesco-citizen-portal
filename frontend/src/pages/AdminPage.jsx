import { Routes, Route, NavLink, useNavigate } from "react-router-dom"
import { useState }       from "react"
import { useAuth }        from "@/context/AuthContext"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button }         from "@/components/ui/button"
import { Input }          from "@/components/ui/input"
import { Label }          from "@/components/ui/label"
import { Badge }          from "@/components/ui/badge"
import { Separator }      from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Zap, LayoutDashboard, CalendarDays,
  Coins, Wrench, Building2, LogOut, ChevronRight,
  Plus, Trash2, CheckCircle, XCircle, Loader2,
  RefreshCw, AlertTriangle, Activity, Users,
  UserPlus, Shield, Megaphone, Menu, ArrowLeft,
} from "lucide-react"
import api from "@/services/api"

const STATUS_OPTIONS = [
  { value: "on",            label: "Power ON",      color: "bg-green-100 text-green-700 border-green-200" },
  { value: "shedding_soon", label: "Shedding soon", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "load_shedding", label: "Load shedding", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "fault",         label: "Fault",         color: "bg-red-100 text-red-700 border-red-200" },
  { value: "maintenance",   label: "Maintenance",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "no_data",       label: "No data",       color: "bg-slate-100 text-slate-600 border-slate-200" },
]

function StatusBadge({ status }) {
  const cfg = STATUS_OPTIONS.find(s => s.value === status) ?? STATUS_OPTIONS[5]
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function Table({ headers, children, empty }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50/80 border-b border-slate-200">
          <tr>
            {headers.map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {empty && <div className="text-center py-12 text-slate-400 text-sm">{empty}</div>}
    </div>
  )
}

function DashboardHome() {
  const { user } = useAuth()
  const { data: feeders }   = useQuery({ queryKey: ["admin-feeders"],         queryFn: () => api.get("/feeders/").then(r => r.data.data), staleTime: 30000 })
  const { data: schedules } = useQuery({ queryKey: ["admin-schedules-today"], queryFn: () => api.get("/schedules/today").then(r => r.data.data), staleTime: 60000 })
  const { data: requests }  = useQuery({ queryKey: ["admin-requests-count"],  queryFn: () => api.get("/service-requests/").then(r => r.data), staleTime: 60000 })

  const on          = feeders?.filter(f => f.status === "on").length ?? 0
  const faults      = feeders?.filter(f => f.status === "fault").length ?? 0
  const maintenance = feeders?.filter(f => f.status === "maintenance").length ?? 0
  const outageFeeders  = feeders?.filter(f => f.status === "fault" || f.status === "load_shedding") ?? []
  const pending        = requests?.data?.filter(r => r.status === "pending").length ?? 0
  const recentRequests = requests?.data?.slice(0, 5) ?? []

  const stats = [
    { label: "Active feeders",   value: `${on}/${feeders?.length ?? 12}`, icon: Zap,           color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Scheduled today",  value: schedules?.length ?? "-",          icon: CalendarDays,  color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Faults / outages", value: faults,                            icon: AlertTriangle, color: "text-red-600",    bg: "bg-red-50"    },
    { label: "In maintenance",   value: maintenance,                       icon: Wrench,        color: "text-amber-600",  bg: "bg-amber-50"  },
    { label: "Pending requests", value: pending,                           icon: Users,         color: "text-purple-600", bg: "bg-purple-50" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Signed in as {user?.email}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 space-y-3 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>
      {feeders && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Feeder Grid Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {feeders.map(f => (
              <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-mono text-slate-500">{f.feeder_code}</span>
                  <StatusBadge status={f.status} />
                </div>
                <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Load: {f.load_percent}%</span>
                  <span>Reliability: {f.reliability}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-iesco-teal rounded-full" style={{ width: `${f.reliability}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Active Outages</h3>
            {outageFeeders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
                No active outages right now
              </div>
            ) : (
              <div className="space-y-2">
                {outageFeeders.map(f => (
                  <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{f.name}</p>
                      <p className="text-xs text-slate-400">{f.sector} - {f.feeder_code}</p>
                    </div>
                    <StatusBadge status={f.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Recent Service Requests</h3>
            {recentRequests.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
                No requests yet
              </div>
            ) : (
              <div className="space-y-2">
                {recentRequests.map(r => (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.full_name}</p>
                      <p className="text-xs font-mono text-slate-400">{r.ticket_number}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200 flex-shrink-0">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}

function FeedersPanel() {
  const qc = useQueryClient()
  const { data: feeders, isLoading } = useQuery({
    queryKey: ["admin-feeders-panel"],
    queryFn:  () => api.get("/feeders/").then(r => r.data.data),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, status, reliability }) => api.patch(`/feeders/${id}/status`, { status, reliability }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-feeders-panel"] }),
  })
  const [editingReliability, setEditingReliability] = useState(null)
  const [reliabilityDraft, setReliabilityDraft]     = useState("")

  function startEditReliability(f) {
    setEditingReliability(f.id)
    setReliabilityDraft(String(f.reliability))
  }

  function saveReliability(f) {
    const val = parseInt(reliabilityDraft, 10)
    if (!isNaN(val) && val >= 0 && val <= 100 && val !== f.reliability) {
      updateMutation.mutate({ id: f.id, status: f.status, reliability: val })
    }
    setEditingReliability(null)
  }
  if (isLoading) return <div className="py-12 text-center text-slate-400">Loading feeders...</div>
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manage Feeders</h2>
          <p className="text-sm text-slate-500">{feeders?.length} feeders</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-feeders-panel"] })}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
        </Button>
      </div>
      <Table headers={["Feeder", "Sector", "Status", "Load %", "Reliability", "Change Status"]}>
        {feeders?.map(f => (
          <tr key={f.id} className="hover:bg-slate-50 transition-colors">
            <td className="py-3 px-4">
              <p className="font-medium text-slate-800">{f.name}</p>
              <p className="text-xs font-mono text-slate-400">{f.feeder_code}</p>
            </td>
            <td className="py-3 px-4 text-sm text-slate-600">{f.sector}</td>
            <td className="py-3 px-4"><StatusBadge status={f.status} /></td>
            <td className="py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-iesco-teal rounded-full" style={{ width: `${f.load_percent}%` }} />
                </div>
                <span className="text-xs text-slate-500">{f.load_percent}%</span>
              </div>
            </td>
            <td className="py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full overflow-hidden bg-slate-200">
                  <div className="h-full rounded-full" style={{ width: `${f.reliability}%`, background: f.reliability > 80 ? "#22C55E" : f.reliability > 60 ? "#D97706" : "#EF4444" }} />
                </div>
                {editingReliability === f.id ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    autoFocus
                    className="w-14 h-6 text-xs border border-slate-300 rounded px-1"
                    value={reliabilityDraft}
                    onChange={(e) => setReliabilityDraft(e.target.value)}
                    onBlur={() => saveReliability(f)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveReliability(f); if (e.key === "Escape") setEditingReliability(null) }}
                  />
                ) : (
                  <button
                    className="text-xs text-slate-500 hover:text-iesco-teal hover:underline"
                    onClick={() => startEditReliability(f)}
                  >
                    {f.reliability}%
                  </button>
                )}
              </div>
            </td>
            <td className="py-3 px-4">
              <Select value={f.status} onValueChange={(val) => updateMutation.mutate({ id: f.id, status: val })} disabled={updateMutation.isPending}>
                <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}

function SchedulesPanel() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ feeder_id: "", schedule_date: "", start_time: "", end_time: "", type: "scheduled", notes: "" })
  const [err, setErr]           = useState("")

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["admin-schedules"],
    queryFn:  () => api.get("/schedules/", { params: { days_ahead: 14 } }).then(r => r.data),
  })
  const { data: feeders } = useQuery({
    queryKey: ["admin-feeders-list"],
    queryFn:  () => api.get("/feeders/").then(r => r.data.data),
    staleTime: 300000,
  })
  const addMutation = useMutation({
    mutationFn: (body) => api.post("/schedules/", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-schedules"] })
      setShowForm(false)
      setForm({ feeder_id: "", schedule_date: "", start_time: "", end_time: "", type: "scheduled", notes: "" })
      setErr("")
    },
    onError: (e) => setErr(e.response?.data?.detail || "Failed to create schedule"),
  })
  const delMutation = useMutation({
    mutationFn: (id) => api.delete(`/schedules/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-schedules"] }),
  })

  const rows = schedules?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Load Shedding Schedules</h2>
          <p className="text-sm text-slate-500">{rows.length} entries in the next 14 days</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1.5" /> Add Schedule</Button>
      </div>
      {isLoading ? <div className="py-12 text-center text-slate-400">Loading...</div> : (
        <Table headers={["Feeder", "Date", "Time", "Duration", "Type", "Actions"]} empty={rows.length === 0 ? "No schedules found" : null}>
          {rows.map(s => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="py-3 px-4">
                <p className="font-medium text-sm text-slate-800">{s.feeders?.name ?? s.feeder_id}</p>
                <p className="text-xs text-slate-400">{s.feeders?.sector}</p>
              </td>
              <td className="py-3 px-4 text-sm text-slate-700">{s.schedule_date}</td>
              <td className="py-3 px-4 text-sm font-mono text-slate-700">{s.start_time} - {s.end_time}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{s.duration_hours}h</td>
              <td className="py-3 px-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.type === "scheduled" ? "bg-blue-50 text-blue-700 border-blue-200" : s.type === "maintenance" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {s.type}
                </span>
              </td>
              <td className="py-3 px-4">
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => delMutation.mutate(s.id)} disabled={delMutation.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Schedule Entry</DialogTitle>
            <DialogDescription>The database will reject overlapping time windows automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Feeder *</Label>
              <Select value={form.feeder_id} onValueChange={v => setForm(p => ({ ...p, feeder_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select feeder" /></SelectTrigger>
                <SelectContent>{feeders?.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.schedule_date} onChange={e => setForm(p => ({ ...p, schedule_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="unplanned">Expected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start time *</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End time *</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input placeholder="e.g. Transformer maintenance" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setErr("") }}>Cancel</Button>
              <Button className="flex-1" disabled={!form.feeder_id || !form.schedule_date || !form.start_time || !form.end_time || addMutation.isPending} onClick={() => addMutation.mutate(form)}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TariffsPanel() {
  const qc = useQueryClient()
  const [showRevision, setShowRevision] = useState(false)
  const [consumerType, setConsumerType] = useState("residential")
  const { data, isLoading } = useQuery({
    queryKey: ["admin-tariffs", consumerType],
    queryFn:  () => api.get("/tariffs/current", { params: { consumer_type: consumerType } }).then(r => r.data),
  })
  const slabs = data?.data ?? []
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tariff Rates</h2>
          <p className="text-sm text-slate-500">Current NEPRA rates effective {slabs[0]?.effective_from ?? "-"}</p>
        </div>
        <div className="flex gap-2">
          <Select value={consumerType} onValueChange={setConsumerType}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowRevision(true)}><Plus className="h-4 w-4 mr-1.5" /> New Revision</Button>
        </div>
      </div>
      {isLoading ? <div className="py-12 text-center text-slate-400">Loading tariffs...</div> : (
        <Table headers={["Unit Range", "Peak Rate (PKR/unit)", "Off-peak Rate", "Fixed Charge", "FC Surcharge", "TR Surcharge"]}>
          {slabs.map(s => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="py-3 px-4 font-medium text-slate-800">{s.units_to ? `${s.units_from}-${s.units_to} units` : `${s.units_from}+ units`}</td>
              <td className="py-3 px-4 font-mono text-slate-700">PKR {Number(s.peak_rate).toFixed(2)}</td>
              <td className="py-3 px-4 font-mono text-slate-700">PKR {Number(s.offpeak_rate).toFixed(2)}</td>
              <td className="py-3 px-4 font-mono text-slate-700">PKR {Number(s.fixed_charge).toFixed(0)}</td>
              <td className="py-3 px-4 font-mono text-slate-500">{s.fc_surcharge}</td>
              <td className="py-3 px-4 font-mono text-slate-500">{s.tr_surcharge}</td>
            </tr>
          ))}
        </Table>
      )}
      <Dialog open={showRevision} onOpenChange={setShowRevision}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit New Revision</DialogTitle>
            <DialogDescription>Use the API docs to submit a full NEPRA rate revision.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-slate-600">Use the <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs">POST /tariffs/revision</code> endpoint in the API docs.</p>
            <Button asChild className="w-full">
              <a href="http://localhost:8000/docs#/Tariffs/create_revision_tariffs_revision_post" target="_blank" rel="noopener noreferrer">Open API Docs</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ServicesPanel() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter]   = useState("all")
  const [form, setForm]       = useState({ name: "", provider_type: "electrician", area: "", phone: "", license_number: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-services", filter],
    queryFn:  () => api.get("/services/", { params: { verified_only: false, available_only: false } }).then(r => r.data),
  })
  const verifyMutation = useMutation({
    mutationFn: ({ id, verify }) => api.patch(`/services/${id}/verify`, null, { params: { verify } }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/services/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  })
  const addMutation = useMutation({
    mutationFn: (body) => api.post("/services/", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-services"] })
      setShowAdd(false)
      setForm({ name: "", provider_type: "electrician", area: "", phone: "", license_number: "" })
    },
  })

  const providers = data?.data ?? []
  const filtered  = filter === "all" ? providers : filter === "unverified" ? providers.filter(p => !p.is_verified) : providers.filter(p => p.provider_type === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Service Providers</h2>
          <p className="text-sm text-slate-500">{providers.length} total · {providers.filter(p => p.is_verified).length} verified</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="electrician">Electricians</SelectItem>
              <SelectItem value="repair_centre">Repair Centres</SelectItem>
              <SelectItem value="meter_agent">Meter Agents</SelectItem>
              <SelectItem value="new_connection_agent">New Connection</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" /> Add Provider</Button>
        </div>
      </div>
      {isLoading ? <div className="py-12 text-center text-slate-400">Loading...</div> : (
        <Table headers={["Name", "Type", "Area", "Phone", "Rating", "Verified", "Actions"]}>
          {filtered.map(p => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="py-3 px-4">
                <p className="font-medium text-sm text-slate-800">{p.name}</p>
                {p.license_number && <p className="text-xs font-mono text-slate-400">{p.license_number}</p>}
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">{p.provider_type.replace("_", " ")}</td>
              <td className="py-3 px-4 text-xs text-slate-600 max-w-32 truncate">{p.area}</td>
              <td className="py-3 px-4"><a href={`tel:${p.phone}`} className="text-xs font-mono text-blue-600 hover:underline">{p.phone}</a></td>
              <td className="py-3 px-4 text-sm">{p.total_reviews > 0 ? <span className="text-amber-600 font-medium">★ {Number(p.rating).toFixed(1)}</span> : <span className="text-slate-400">-</span>}</td>
              <td className="py-3 px-4">{p.is_verified ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle className="h-3.5 w-3.5" /> Verified</span> : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><XCircle className="h-3.5 w-3.5" /> Pending</span>}</td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => verifyMutation.mutate({ id: p.id, verify: !p.is_verified })}>{p.is_verified ? "Unverify" : "Verify"}</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Service Provider</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {[
              { label: "Full name *",      key: "name",           placeholder: "e.g. Muhammad Tariq Electric Works" },
              { label: "Area served *",    key: "area",           placeholder: "e.g. G-11, F-10, G-9" },
              { label: "Phone *",          key: "phone",          placeholder: "0300-1234567" },
              { label: "License number",   key: "license_number", placeholder: "IESCO-EL-2024-XXXX" },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.provider_type} onValueChange={v => setForm(p => ({ ...p, provider_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="electrician">Electrician</SelectItem>
                  <SelectItem value="repair_centre">Repair Centre</SelectItem>
                  <SelectItem value="meter_agent">Meter Agent</SelectItem>
                  <SelectItem value="new_connection_agent">New Connection Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!form.name || !form.area || !form.phone || addMutation.isPending} onClick={() => addMutation.mutate(form)}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Provider
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LocationsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-locations"],
    queryFn:  () => api.get("/locations/").then(r => r.data),
  })
  const locations = data?.data ?? []
  const byType    = locations.reduce((acc, l) => { acc[l.area_type] = (acc[l.area_type] || 0) + 1; return acc }, {})
  const AREA_LABELS = { sector: "Sector", satellite_town: "Satellite Town", cantonment: "Cantonment", rural: "Rural" }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Location Directory</h2>
          <p className="text-sm text-slate-500">{locations.length} locations · {Object.entries(byType).map(([k,v]) => `${v} ${AREA_LABELS[k] ?? k}s`).join(", ")}</p>
        </div>
      </div>
      {isLoading ? <div className="py-12 text-center text-slate-400">Loading...</div> : (
        <Table headers={["Name", "Type", "Office", "Phone", "Complaint Line", "Feeder"]}>
          {locations.map(l => (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className="py-3 px-4 font-medium text-sm text-slate-800">{l.name}</td>
              <td className="py-3 px-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{AREA_LABELS[l.area_type] ?? l.area_type}</span></td>
              <td className="py-3 px-4 text-xs text-slate-600">{l.office_name}</td>
              <td className="py-3 px-4"><a href={`tel:${l.office_phone}`} className="text-xs font-mono text-blue-600 hover:underline">{l.office_phone}</a></td>
              <td className="py-3 px-4"><a href={`tel:${l.complaint_phone}`} className="text-xs font-mono text-red-600 hover:underline">{l.complaint_phone}</a></td>
              <td className="py-3 px-4">{l.feeders ? <StatusBadge status={l.feeders.status} /> : <span className="text-xs text-slate-400">Not linked</span>}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}

function AnnouncementsPanel() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ type: "info", text: "", link: "", link_text: "", is_active: true, sort_order: 0 })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn:  () => api.get("/announcements/").then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (body) => api.post("/announcements/", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); closeForm() },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/announcements/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); closeForm() },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-announcements"] }),
  })
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/announcements/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-announcements"] }),
  })

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ type: "info", text: "", link: "", link_text: "", is_active: true, sort_order: 0 })
  }

  function openEdit(a) {
    setEditingId(a.id)
    setForm({ type: a.type, text: a.text, link: a.link || "", link_text: a.link_text || "", is_active: a.is_active, sort_order: a.sort_order })
    setShowForm(true)
  }

  function handleSave() {
    if (editingId) {
      updateMutation.mutate({ id: editingId, body: form })
    } else {
      addMutation.mutate(form)
    }
  }

  const announcements = data?.data ?? []
  const TYPE_COLORS = {
    info:    "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    alert:   "bg-red-50 text-red-700 border-red-200",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Announcements</h2>
          <p className="text-sm text-slate-500">{announcements.length} total - shown in rotating order on the site banner</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1.5" /> Add Announcement</Button>
      </div>
      {isLoading ? <div className="py-12 text-center text-slate-400">Loading...</div> : (
        <Table headers={["Order", "Type", "Text", "Link", "Active", "Actions"]} empty={announcements.length === 0 ? "No announcements yet" : null}>
          {announcements.map(a => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="py-3 px-4 text-sm text-slate-500">{a.sort_order}</td>
              <td className="py-3 px-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[a.type] ?? TYPE_COLORS.info}`}>{a.type}</span>
              </td>
              <td className="py-3 px-4 text-sm text-slate-700 max-w-sm truncate">{a.text}</td>
              <td className="py-3 px-4 text-xs text-slate-500">{a.link || "-"}</td>
              <td className="py-3 px-4">
                <button onClick={() => toggleActiveMutation.mutate({ id: a.id, is_active: !a.is_active })}>
                  {a.is_active
                    ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle className="h-3.5 w-3.5" /> Active</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><XCircle className="h-3.5 w-3.5" /> Inactive</span>}
                </button>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEdit(a)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Announcement" : "Add Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (teal)</SelectItem>
                  <SelectItem value="warning">Warning (amber)</SelectItem>
                  <SelectItem value="alert">Alert (red)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Text *</Label>
              <Input placeholder="e.g. Planned maintenance in G-9 on July 20" value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Link (optional)</Label>
                <Input placeholder="/schedule" value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Link text</Label>
                <Input placeholder="View Schedule" value={form.link_text} onChange={e => setForm(p => ({ ...p, link_text: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
              <Button className="flex-1" disabled={!form.text || addMutation.isPending || updateMutation.isPending} onClick={handleSave}>
                {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? "Save Changes" : "Create Announcement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdminsPanel() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({ email: "", password: "" })
  const [err, setErr]         = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn:  () => api.get("/admin/users/").then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (body) => api.post("/admin/users/", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users-list"] })
      setShowAdd(false)
      setForm({ email: "", password: "" })
      setErr("")
    },
    onError: (e) => setErr(e.response?.data?.detail || "Failed to create admin"),
  })

  const admins = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Admin Users</h2>
          <p className="text-sm text-slate-500">{admins.length} admin accounts</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><UserPlus className="h-4 w-4 mr-1.5" /> Add Admin</Button>
      </div>
      {isLoading ? <div className="py-12 text-center text-slate-400">Loading...</div> : (
        <Table headers={["Email", "User ID", "Created"]} empty={admins.length === 0 ? "No admin users found" : null}>
          {admins.map(a => (
            <tr key={a.id} className="hover:bg-slate-50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-iesco-teal flex-shrink-0" />
                  <span className="font-medium text-sm text-slate-800">{a.email}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-xs font-mono text-slate-400">{a.id}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{a.created_at ? new Date(a.created_at).toLocaleDateString("en-PK") : "-"}</td>
            </tr>
          ))}
        </Table>
      )}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Admin Account</DialogTitle>
            <DialogDescription>This user will get full admin access immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="admin@iesco.gov.pk" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" placeholder="At least 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAdd(false); setErr("") }}>Cancel</Button>
              <Button className="flex-1" disabled={!form.email || form.password.length < 8 || addMutation.isPending} onClick={() => addMutation.mutate(form)}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const NAV_ITEMS = [
  { to: "/admin",              label: "Dashboard",         icon: LayoutDashboard, end: true },
  { to: "/admin/feeders",      label: "Feeders",           icon: Zap              },
  { to: "/admin/schedule",     label: "Schedules",         icon: CalendarDays     },
  { to: "/admin/tariffs",      label: "Tariff Rates",      icon: Coins            },
  { to: "/admin/services",     label: "Service Providers", icon: Wrench           },
  { to: "/admin/locations",    label: "Locations",         icon: Building2        },
  { to: "/admin/announcements",label: "Announcements",     icon: Megaphone        },
  { to: "/admin/admins",       label: "Admin Users",       icon: Shield           },
]

function AdminSidebarContent({ user, onSignOut, onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-iesco-teal/20 border border-iesco-teal/40 flex items-center justify-center shadow-sm">
          <Zap className="h-4.5 w-4.5 text-iesco-teal" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">IESCO Admin</p>
          <p className="text-slate-500 text-xs">Management Portal</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? "bg-iesco-teal/15 text-iesco-teal font-medium border border-iesco-teal/20 shadow-sm" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}>
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        <a href="/schedule" className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" />Back to site
        </a>
        <button onClick={onSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-colors text-sm">
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>
    </>
  )
}

export default function AdminPage() {
  const { user, signOut } = useAuth()
  const navigate          = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-[#0D1B3E] flex-col">
        <AdminSidebarContent user={user} onSignOut={handleSignOut} />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-[#0D1B3E] border-r border-white/10 flex flex-col">
          <AdminSidebarContent user={user} onSignOut={handleSignOut} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="border-b border-slate-200 bg-white px-4 md:px-6 py-3 flex items-center gap-2 text-xs text-slate-400 sticky top-0 z-10">
          <button
            className="md:hidden -ml-1 p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 flex-shrink-0"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <span className="hidden sm:inline">IESCO Portal</span>
          <ChevronRight className="h-3 w-3 hidden sm:inline" />
          <span className="text-slate-600 font-medium">Admin</span>
        </div>
        <div className="p-4 md:p-6">
          <Routes>
            <Route index          element={<DashboardHome />} />
            <Route path="feeders"   element={<FeedersPanel />} />
            <Route path="schedule"  element={<SchedulesPanel />} />
            <Route path="tariffs"   element={<TariffsPanel />} />
            <Route path="services"  element={<ServicesPanel />} />
            <Route path="locations" element={<LocationsPanel />} />
            <Route path="announcements" element={<AnnouncementsPanel />} />
            <Route path="admins"    element={<AdminsPanel />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}