import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { Menu, Settings, User, LogOut, Zap, ChevronDown, Wrench, Building2, ClipboardList, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import iescoLogo from "@/assets/iesco-logo.png"
import { LanguageSwitcher } from "./LanguageSwitcher"

const PRIMARY_NAV = [
  { path: "/schedule", key: "nav.scheduleMap" },
  { path: "/billing",  key: "nav.billing"     },
  { path: "/tariffs",  key: "nav.tariffs"     },
]

const MORE_NAV = [
  { path: "/services",          key: "nav.services",         icon: Wrench        },
  { path: "/contact-directory", key: "nav.contactDirectory", icon: Building2     },
  { path: "/self-service",      key: "nav.selfService",      icon: ClipboardList },
]

export default function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAdmin, isUser, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate("/", { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 max-w-7xl flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <img src={iescoLogo} alt="IESCO" className="h-9 w-auto object-contain" />
          <span className="text-iesco-navy dark:text-white">IESCO Portal</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {PRIMARY_NAV.map((link) => (
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm
                                 text-muted-foreground hover:text-foreground hover:bg-accent
                                 transition-colors">
                {t("nav.more", "More")}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {MORE_NAV.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path} className="cursor-pointer flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-slate-400" />
                      {t(item.key)}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
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

          {isUser && !isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-iesco-teal/10 border border-iesco-teal/30 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-iesco-teal" />
                  </div>
                  <span className="text-sm text-slate-600 max-w-24 truncate hidden sm:block">
                    {user?.user_metadata?.full_name?.split(" ")[0] ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {user?.user_metadata?.full_name ?? "Citizen"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/self-service" className="cursor-pointer">My Requests</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/billing" className="cursor-pointer">Pay Bill</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer focus:text-red-600">
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !isUser ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
          ) : null}

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
                {[...PRIMARY_NAV, ...MORE_NAV].map((link) => (
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