// src/pages/AdminLoginPage.jsx
import { useState }                from "react"
import { useNavigate, Navigate }   from "react-router-dom"
import { Link }                    from "react-router-dom"
import { supabase }                from "@/lib/supabase"
import { useAuth }                 from "@/context/AuthContext"
import { Button }                  from "@/components/ui/button"
import { Input }                   from "@/components/ui/input"
import { Label }                   from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Zap, Loader2, Eye, EyeOff,
  Mail, Lock, ShieldAlert, ArrowLeft,
} from "lucide-react"

export default function AdminLoginPage() {
  const { isAdmin, isLoading } = useAuth()
  const navigate                = useNavigate()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  // Already admin — go straight to dashboard
  if (!isLoading && isAdmin) return <Navigate to="/admin" replace />

  async function handleLogin(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    })

    if (authError) {
      setLoading(false)
      if (authError.message.includes("Invalid login credentials")) {
        setError("Incorrect email or password.")
      } else {
        setError(authError.message)
      }
      return
    }

    // Check admin role from the returned session
    const role = data.user?.app_metadata?.role
    if (role !== "admin") {
      // Signed in successfully but not an admin — sign them out
      await supabase.auth.signOut()
      setLoading(false)
      setError(
        "This account does not have admin access. " +
        "Use the citizen portal for regular accounts."
      )
      return
    }

    setLoading(false)
    navigate("/admin", { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#0D1B3E] flex items-center justify-center p-4">

      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
           style={{
             backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
             backgroundSize: "40px 40px",
           }} />

      {/* Card */}
      <div className="relative w-full max-w-sm space-y-6">

        {/* Back to portal link */}
        <Link to="/"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white
                     transition-colors text-sm w-fit">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to citizen portal
        </Link>

        {/* Logo + heading */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-iesco-teal/10 border border-iesco-teal/30
                          flex items-center justify-center mx-auto">
            <Zap className="h-8 w-8 text-iesco-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">IESCO Admin Portal</h1>
            <p className="text-slate-400 text-sm mt-1">
              Authorised IESCO staff only
            </p>
          </div>
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20
                        rounded-xl px-4 py-3">
          <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            This portal is for authorised IESCO personnel only. Unauthorised
            access attempts are logged and may be subject to legal action.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6
                        backdrop-blur-sm space-y-5">

          {error && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-slate-300 text-sm">
                Work email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@iesco.gov.pk"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-9 bg-white/5 border-white/10 text-white
                             placeholder:text-slate-500
                             focus:border-iesco-teal/50 focus:ring-iesco-teal/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-slate-300 text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="admin-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-9 pr-9 bg-white/5 border-white/10 text-white
                             placeholder:text-slate-500
                             focus:border-iesco-teal/50 focus:ring-iesco-teal/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-iesco-teal hover:bg-iesco-teal/90 text-white
                         font-semibold mt-2"
              disabled={loading}>
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>
                : "Sign in to Admin Portal"
              }
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-slate-600 text-xs">
            IESCO Smart Citizen Portal — Admin Access
          </p>
          <p className="text-slate-700 text-xs">
            Not an admin?{" "}
            <Link to="/login" className="text-iesco-teal hover:underline">
              Go to citizen portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}