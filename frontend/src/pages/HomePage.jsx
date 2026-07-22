import { Link }                from "react-router-dom"
import { useQuery }            from "@tanstack/react-query"
import { useEffect, useState } from "react"
import {
  CalendarDays, CreditCard, MapPin, Wrench,
  Zap, ArrowRight, Phone, AlertTriangle,
  CheckCircle, Clock, Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import api        from "@/services/api"

function useLiveStats() {
  return useQuery({
    queryKey: ["home-stats"],
    queryFn:  async () => {
      const [feeders, active] = await Promise.all([
        api.get("/feeders/").then(r => r.data.data),
        api.get("/schedules/active").then(r => r.data),
      ])
      const on       = feeders.filter(f => f.status === "on").length
      const fault    = feeders.filter(f => f.status === "fault").length
      const shedding = feeders.filter(f => f.status === "load_shedding").length
      return { total: feeders.length, on, fault, shedding, active: active.count || 0 }
    },
    staleTime:       30000,
    refetchInterval: 30000,
  })
}

const SERVICES = [
  { icon: "⚡", label: "Schedule",  sublabel: "Load shedding",  href: "/schedule",    color: "bg-blue-500"  },
  { icon: "💳", label: "Pay Bill",  sublabel: "3 payment ways", href: "/billing",     color: "bg-green-500" },
  { icon: "🗺️", label: "Live Map",  sublabel: "Real-time",      href: "/map",         color: "bg-purple-500"},
  { icon: "💰", label: "Tariffs",   sublabel: "NEPRA rates",    href: "/tariffs",     color: "bg-amber-500" },
  { icon: "📍", label: "Locations", sublabel: "IESCO offices",  href: "/locations",   color: "bg-red-500"   },
  { icon: "🔧", label: "Services",  sublabel: "Electricians",   href: "/services",    color: "bg-teal-500"  },
  { icon: "📋", label: "Requests",  sublabel: "Self-service",   href: "/self-service",color: "bg-orange-500"},
  { icon: "🔔", label: "Alerts",    sublabel: "SMS outages",    href: "/schedule",    color: "bg-pink-500"  },
]

function Hero({ stats, statsLoading }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const pktTime = time.toLocaleTimeString("en-PK", {
    timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  })

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0D1B3E] to-[#133A6B] text-white">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#ffffff22 1px, transparent 1px), linear-gradient(90deg, #ffffff22 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute top-0 right-0 w-96 h-96 bg-iesco-teal/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-sm backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-slate-200">Pakistan Standard Time · {pktTime}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-iesco-teal/20 border border-iesco-teal/40 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-iesco-teal" />
                </div>
                <span className="text-iesco-teal font-semibold tracking-widest text-sm uppercase">IESCO Smart Citizen Portal</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                Islamabad's
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-iesco-teal to-blue-400">Power at a Glance</span>
              </h1>
              <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
                Check load shedding schedules, pay your electricity bill, track outages live on the map — all in one place. Available in اردو too.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="bg-iesco-teal hover:bg-iesco-teal/90 text-white font-semibold shadow-lg shadow-iesco-teal/25">
                <Link to="/schedule"><CalendarDays className="h-4 w-4 mr-2" />Check Today's Schedule</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm bg-transparent">
                <Link to="/map"><MapPin className="h-4 w-4 mr-2" />Live Map</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[{ label: "Pay Bill", href: "/billing" }, { label: "Tariff Rates", href: "/tariffs" }, { label: "Services", href: "/services" }, { label: "Submit Request", href: "/self-service" }].map((l) => (
                <Link key={l.href} to={l.href} className="text-sm text-slate-400 hover:text-iesco-teal transition-colors flex items-center gap-1">
                  {l.label} <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Feeders Online",  value: statsLoading ? "-" : `${stats?.on ?? 0}/${stats?.total ?? 12}`, icon: CheckCircle,  color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20",   sub: "Islamabad coverage" },
              { label: "Active Outages",  value: statsLoading ? "-" : stats?.shedding ?? 0,                      icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", sub: "Scheduled today" },
              { label: "Faults Detected", value: statsLoading ? "-" : stats?.fault ?? 0,                         icon: Zap,           color: "text-red-400",    bg: "bg-red-400/10 border-red-400/20",       sub: "Expected outages" },
              { label: "System Status",   value: (stats?.fault ?? 0) === 0 ? "Normal" : "Alert",                 icon: Activity,      color: (stats?.fault ?? 0) === 0 ? "text-green-400" : "text-red-400", bg: "bg-white/5 border-white/10", sub: "Grid condition" },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className={`${stat.bg} border rounded-2xl p-5 backdrop-blur-sm`}>
                  <div className="flex items-start justify-between mb-3">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-xs text-slate-500">{stat.sub}</span>
                  </div>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                </div>
              )
            })}
            <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <Phone className="h-4 w-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 font-medium">IESCO 24/7 Helpline</p>
                <p className="text-slate-500 text-xs">For emergencies · خرابی کی اطلاع</p>
              </div>
              <a href="tel:051-9252148" className="font-mono text-lg font-bold text-white hover:text-iesco-teal transition-colors flex-shrink-0">051-9252148</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-sm font-semibold text-slate-400
                      uppercase tracking-widest mb-6">
          Quick Access
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
          {SERVICES.map((s) => (
            <Link key={s.href + s.label} to={s.href}
              className="flex flex-col items-center gap-2 group">
              <div className={`${s.color} w-14 h-14 sm:w-16 sm:h-16
                              rounded-2xl flex items-center justify-center
                              text-2xl shadow-sm
                              group-hover:scale-110 group-hover:shadow-md
                              transition-all duration-200`}>
                {s.icon}
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {s.label}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight hidden sm:block">
                  {s.sublabel}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { data: stats, isLoading } = useLiveStats()
  return (
    <div className="min-h-screen">
      <Hero stats={stats} statsLoading={isLoading} />
      <FeaturesSection />
      <section className="bg-iesco-navy py-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Install the app for offline access</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">Check your load shedding schedule even without internet - especially useful during power cuts.</p>
          <Button size="lg" className="bg-iesco-teal hover:bg-iesco-teal/90 text-white">
            <Zap className="h-4 w-4 mr-2" />Add to Home Screen
          </Button>
        </div>
      </section>
    </div>
  )
}