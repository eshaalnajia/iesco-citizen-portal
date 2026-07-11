// src/pages/ForgotPasswordPage.jsx
import { useState }            from "react"
import { Link }                from "react-router-dom"
import { supabase }            from "@/lib/supabase"
import { Button }              from "@/components/ui/button"
import { Input }               from "@/components/ui/input"
import { Label }               from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState("")

  async function handleReset(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    )

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6">

        <Link to="/login"
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700
                     transition-colors text-sm w-fit">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl p-7 space-y-6 shadow-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-iesco-navy flex items-center justify-center">
              <Zap className="h-4 w-4 text-iesco-teal" />
            </div>
            <span className="font-bold text-slate-900">IESCO Portal</span>
          </div>

          {sent ? (
            <div className="text-center space-y-3 py-2">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
              <div>
                <p className="font-semibold text-slate-900">Email sent</p>
                <p className="text-sm text-slate-500 mt-1">
                  Check <span className="font-medium">{email}</span> for
                  a password reset link. It expires in 1 hour.
                </p>
              </div>
              <Link to="/login"
                className="text-sm text-iesco-teal hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Forgot password?</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Enter your email and we'll send a reset link.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="reset-email" type="email"
                      placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="pl-9" required disabled={loading} />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                    : "Send reset link"
                  }
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}