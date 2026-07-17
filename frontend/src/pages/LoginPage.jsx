import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Zap, Loader2, Eye, EyeOff, Mail, Lock,
  User, ArrowLeft, CheckCircle, Phone,
} from "lucide-react"

const FEATURES = [
  "Check load shedding schedule for your sector",
  "Pay your electricity bill in 3 clicks",
  "Track self-service request status by ticket number",
  "Get SMS alerts when power goes out in your area",
  "Find verified IESCO electricians near you",
]

function SignupSuccess({ email }) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-200
                      flex items-center justify-center mx-auto">
        <CheckCircle className="h-8 w-8 text-green-500" />
      </div>
      <div>
        <h3 className="font-bold text-slate-900 text-lg">Account created!</h3>
        <p className="text-slate-500 text-sm mt-1.5 max-w-xs mx-auto">
          We've sent a confirmation email to{" "}
          <span className="font-semibold text-slate-700">{email}</span>.
          Click the link in the email to activate your account.
        </p>
      </div>
      <p className="text-xs text-slate-400">
        Didn't receive it? Check your spam folder.
      </p>
      <Link to="/login"
        className="text-sm text-iesco-teal hover:underline font-medium">
        Back to sign in
      </Link>
    </div>
  )
}

function SignInForm({ onSuccess }) {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  async function handleSignIn(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Wrong email or password. Try again.")
      } else if (error.message.includes("Email not confirmed")) {
        setError("Please confirm your email address first. Check your inbox.")
      } else {
        setError(error.message)
      }
      return
    }

    onSuccess?.()
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="signin-email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input id="signin-email" type="email" autoComplete="email"
            placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            className="pl-9" required disabled={loading} />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="signin-password">Password</Label>
          <Link to="/forgot-password"
            className="text-xs text-iesco-teal hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input id="signin-password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="********"
            value={password} onChange={e => setPassword(e.target.value)}
            className="pl-9 pr-9" required disabled={loading} />
          <button type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
          : "Sign in"
        }
      </Button>
    </form>
  )
}

function SignUpForm({ onSuccess }) {
  const [form, setForm]       = useState({ name: "", email: "", phone: "", password: "", confirm: "" })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  function field(key) {
    return {
      value:    form[key],
      onChange: e => setForm(p => ({ ...p, [key]: e.target.value })),
      disabled: loading,
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirm) {
      setError("Passwords do not match.")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email:    form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.name.trim(),
          phone:     form.phone.trim(),
        },
      },
    })
    setLoading(false)

    if (error) {
      if (error.message.includes("already registered")) {
        setError("This email is already registered. Try signing in instead.")
      } else {
        setError(error.message)
      }
      return
    }

    onSuccess?.(form.email)
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input id="name" placeholder="Muhammad Ahmed" {...field("name")}
            className="pl-9" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input id="email" type="email" placeholder="you@example.com"
              {...field("email")} className="pl-9" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input id="phone" type="tel" placeholder="03XXXXXXXXX"
              {...field("phone")} className="pl-9 font-mono" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input id="password"
              type={showPw ? "text" : "password"}
              placeholder="Min. 8 characters"
              {...field("password")} className="pl-9 pr-9" required />
            <button type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm</Label>
          <Input id="confirm"
            type={showPw ? "text" : "password"}
            placeholder="Repeat password"
            {...field("confirm")} className="pr-9" required />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account...</>
          : "Create account"
        }
      </Button>

      <p className="text-xs text-center text-slate-400">
        By signing up you agree to IESCO's terms of service
      </p>
    </form>
  )
}

export default function LoginPage() {
  const { isUser, isAdmin, isLoading } = useAuth()
  const navigate                        = useNavigate()
  const location                        = useLocation()
  const [signupEmail, setSignupEmail]   = useState(null)

  const from = location.state?.from?.pathname ?? "/schedule"

  useEffect(() => {
    if (isLoading) return
    if (isAdmin) {
      navigate("/admin", { replace: true })
    } else if (isUser) {
      navigate(from, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAdmin, isUser])

  function handleSignInSuccess() {
    navigate(from, { replace: true })
  }

  function handleSignUpSuccess(email) {
    setSignupEmail(email)
  }

  return (
    <div className="min-h-screen flex">

      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0D1B3E] via-[#133A6B] to-[#0D1B3E]
                      flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
               backgroundSize: "32px 32px",
             }} />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-iesco-teal/20 border border-iesco-teal/40
                          flex items-center justify-center">
            <Zap className="h-5 w-5 text-iesco-teal" />
          </div>
          <div>
            <p className="text-white font-bold">IESCO Portal</p>
            <p className="text-slate-500 text-xs">Smart Citizen Platform</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white leading-tight">
              Manage your electricity
              <span className="text-iesco-teal block">from your phone</span>
            </h1>
            <p className="text-slate-400 leading-relaxed">
              One account gives you access to everything IESCO offers digitally -
              schedules, bills, maps, and more.
            </p>
          </div>

          <ul className="space-y-2.5">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-iesco-teal flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <p className="text-slate-600 text-xs">
            IESCO Smart Citizen Portal - Digital Transformation Initiative 2025
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-iesco-navy flex items-center justify-center">
                <Zap className="h-4 w-4 text-iesco-teal" />
              </div>
              <span className="font-bold text-slate-900">IESCO Portal</span>
            </div>
            <Link to="/schedule" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-iesco-teal transition-colors ml-auto">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to site
            </Link>
          </div>

          {signupEmail ? (
            <SignupSuccess email={signupEmail} />
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Sign in to your IESCO citizen account
                </p>
              </div>

              <Tabs defaultValue="signin">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-5">
                  <SignInForm onSuccess={handleSignInSuccess} />
                </TabsContent>

                <TabsContent value="signup" className="mt-5">
                  <SignUpForm onSuccess={handleSignUpSuccess} />
                </TabsContent>
              </Tabs>

              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-center text-slate-400">
                  IESCO staff?{" "}
                  <Link to="/admin/login"
                    className="text-iesco-teal hover:underline font-medium">
                    Use the admin portal →
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


