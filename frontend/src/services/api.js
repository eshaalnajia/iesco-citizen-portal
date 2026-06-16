import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("iesco_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("iesco_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
