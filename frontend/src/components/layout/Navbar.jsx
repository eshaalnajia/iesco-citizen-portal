import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { Menu, Settings, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import iescoLogo from "@/assets/iesco-logo.png"
import { LanguageSwitcher } from "./LanguageSwitcher"

const navLinks = [
  { path: "/schedule",  key: "nav.schedule"  },
  { path: "/billing",   key: "nav.billing"   },
  { path: "/tariffs",   key: "nav.tariffs"   },
  { path: "/services",  key: "nav.services"  },
  { path: "/locations", key: "nav.locations" },
  { path: "/map",       key: "nav.map"       },
  { path: "/self-service", key: "nav.selfService" },
]

export default function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAdmin } = useAuth()


  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 max-w-7xl flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <img src={iescoLogo} alt="IESCO" className="h-9 w-auto object-contain" />
          <span className="text-iesco-navy dark:text-white">IESCO Portal</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                location.pathname === link.path
                  ? "bg-iesco-teal/10 text-iesco-teal font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin" className="flex items-center gap-1.5">
                <Settings className="h-4 w-4" />
                <Badge variant="secondary" className="bg-iesco-teal/10 text-iesco-teal">
                  Admin
                </Badge>
              </Link>
            </Button>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-md hover:bg-slate-100 transition-colors" aria-label="Menu" data-testid="mobile-menu-trigger">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#0D1B3E] border-l border-white/10">
              <div className="flex items-center gap-3 mb-8 mt-2">
                <div className="w-8 h-8 rounded-lg bg-iesco-teal/20 border border-iesco-teal/40 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-iesco-teal" />
                </div>
                <span className="text-white font-semibold text-sm">IESCO Portal</span>
              </div>
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium px-3 py-3 rounded-lg block"
                  >
                    {t(link.key)}
                  </Link>
                ))}
                {isAdmin && (
                  <Link to="/admin" className="text-iesco-teal hover:text-white hover:bg-white/10 transition-colors text-sm font-medium px-3 py-3 rounded-lg block mt-2 border-t border-white/10 pt-4">
                    Admin Dashboard
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}





