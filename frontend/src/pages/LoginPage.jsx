import { useState } from "react"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()
  const { isAdmin, isLoading } = useAuth()

  if (!isLoading && isAdmin) {
    const from = location.state?.from?.pathname || "/admin"
    return <Navigate to={from} replace />
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.")
      } else if (error.message.includes("Email not confirmed")) {
        setError("Please confirm your email address before logging in.")
      } else {
        setError(error.message)
      }
      return
    }

    const from = location.state?.from?.pathname || "/admin"
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 bg-iesco-navy rounded-xl flex items-center justify-center">
            <Zap className="h-7 w-7 text-iesco-teal" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            IESCO Admin Portal
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to manage the citizen portal
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@iesco.gov.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="--------"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-slate-400">
          IESCO Smart Citizen Portal - Admin access only
        </p>
      </div>
    </div>
  )
}
