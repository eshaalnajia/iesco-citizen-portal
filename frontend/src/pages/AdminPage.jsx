import { Routes, Route, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Zap, LayoutDashboard, MapPin, CalendarDays,
  Coins, Wrench, Building2, LogOut, ChevronRight,
} from "lucide-react"

function DashboardHome() {
  const { user } = useAuth()
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Welcome back</h2>
      <p className="text-slate-500">Signed in as {user?.email}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {[
          { label: "Active feeders",     value: "12" },
          { label: "Scheduled outages",  value: "4"  },
          { label: "Citizen reports",    value: "-"  },
        ].map((stat) => (
          <div key={stat.label} className="border rounded-lg p-4 bg-slate-50">
            <p className="text-2xl font-bold text-iesco-navy">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlaceholderPage({ title }) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-slate-500">This module will be built in Phase 2.</p>
    </div>
  )
}

const navItems = [
  { to: "/admin",           label: "Dashboard",  icon: LayoutDashboard, end: true },
  { to: "/admin/feeders",   label: "Feeders",    icon: MapPin },
  { to: "/admin/schedule",  label: "Schedules",  icon: CalendarDays },
  { to: "/admin/tariffs",   label: "Tariffs",    icon: Coins },
  { to: "/admin/services",  label: "Services",   icon: Wrench },
  { to: "/admin/locations", label: "Locations",  icon: Building2 },
]

export default function AdminPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-56 flex-shrink-0 bg-iesco-navy flex flex-col">
        <div className="flex items-center gap-2 px-4 py-5">
          <Zap className="h-5 w-5 text-iesco-teal" />
          <span className="text-white font-semibold text-sm">IESCO Admin</span>
        </div>

        <Separator className="bg-white/10" />

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-iesco-teal/20 text-iesco-teal font-medium"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Separator className="bg-white/10" />

        <div className="px-4 py-4 space-y-3">
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-6">
          <span>IESCO Portal</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600">Admin</span>
        </div>

        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="feeders"   element={<PlaceholderPage title="Manage Feeders" />} />
          <Route path="schedule"  element={<PlaceholderPage title="Load Shedding Schedules" />} />
          <Route path="tariffs"   element={<PlaceholderPage title="Tariff Rates" />} />
          <Route path="services"  element={<PlaceholderPage title="Service Providers" />} />
          <Route path="locations" element={<PlaceholderPage title="Location Directory" />} />
        </Routes>
      </main>
    </div>
  )
}
