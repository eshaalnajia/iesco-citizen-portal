import { Link, useLocation } from "react-router-dom"
import { CalendarDays, MapPin, CreditCard, Building2, Menu } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const TABS = [
  { path: "/schedule",  icon: CalendarDays, key: "nav.schedule"  },
  { path: "/map",       icon: MapPin,       key: "nav.map"       },
  { path: "/billing",   icon: CreditCard,   key: "nav.billing"   },
  { path: "/locations", icon: Building2,    key: "nav.locations" },
]

const MORE_LINKS = [
  { path: "/tariffs",     key: "nav.tariffs"     },
  { path: "/services",    key: "nav.services"    },
  { path: "/self-service",key: "nav.selfService" },
]

export function MobileBottomNav() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40
                    bg-white border-t border-slate-200
                    flex items-stretch
                    pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = location.pathname === tab.path
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2
                        transition-colors
                        ${active ? "text-iesco-teal" : "text-slate-500"}`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t(tab.key)}</span>
          </Link>
        )
      })}

      <Sheet>
        <SheetTrigger asChild>
          <button
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-slate-500"
            aria-label="More"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <nav className="flex flex-col gap-1 pt-4 pb-6">
            {MORE_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-slate-700 hover:bg-slate-50 transition-colors
                          text-sm font-medium px-4 py-3 rounded-lg block"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </nav>
  )
}