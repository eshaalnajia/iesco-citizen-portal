import { Link, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { Menu, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" data-testid="mobile-menu-trigger">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-3 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-sm font-medium py-2 border-b border-border"
                  >
                    {t(link.key)}
                  </Link>
                ))}
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-medium py-2 text-iesco-teal">
                    Admin dashboard
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










