import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"
import { OfflineBanner } from "@/components/pwa/OfflineBanner"

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OfflineBanner />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

