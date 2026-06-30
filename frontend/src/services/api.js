import axios from "axios"
import { supabase } from "@/lib/supabase"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    localStorage.setItem("iesco-last-sync", new Date().toISOString())
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      supabase.auth.signOut().then(() => {
        window.location.href = "/login"
      })
    }
    return Promise.reject(error)
  }
)

export default api
