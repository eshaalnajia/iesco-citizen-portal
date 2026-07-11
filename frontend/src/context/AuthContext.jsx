import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  const user    = session?.user ?? null
  const role    = user?.app_metadata?.role ?? null
  const isAdmin = role === "admin"
  const isUser  = !!user

  const value = {
    session,
    user,
    role,
    isAdmin,
    isUser,
    isLoading: loading,
    signOut:   () => supabase.auth.signOut(),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>")
  return ctx
}
