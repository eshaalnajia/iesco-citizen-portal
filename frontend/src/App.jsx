import { Routes, Route } from "react-router-dom"
import Layout from "@/components/layout/Layout"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

import HomePage        from "@/pages/HomePage"
import SchedulePage    from "@/pages/SchedulePage"
import BillingPage     from "@/pages/BillingPage"
import PaymentCompletePage from "@/pages/PaymentCompletePage"
import TariffsPage     from "@/pages/TariffsPage"
import ServicesPage    from "@/pages/ServicesPage"
import LocationsPage   from "@/pages/LocationsPage"
import MapPage         from "@/pages/MapPage"
import AdminPage       from "@/pages/AdminPage"
import LoginPage       from "@/pages/LoginPage"
import AdminLoginPage  from "@/pages/AdminLoginPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import NotFoundPage    from "@/pages/NotFoundPage"
import SelfServicePage from "@/pages/SelfServicePage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="schedule"  element={<SchedulePage />} />
        <Route path="billing"   element={<BillingPage />} />
        <Route path="billing/payment-complete" element={<PaymentCompletePage />} />
        <Route path="tariffs"   element={<TariffsPage />} />
        <Route path="services"  element={<ServicesPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="map"       element={<MapPage />} />
        <Route path="self-service" element={<SelfServicePage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}


