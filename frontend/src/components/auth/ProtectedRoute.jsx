import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Loader2 } from "lucide-react"

export default function ProtectedRoute({ children }) {
  const { isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-iesco-teal" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  return children
}
