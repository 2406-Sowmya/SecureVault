import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/Layout'
import AnimatedBackground from './components/AnimatedBackground'
import DashboardLayout from './components/DashboardLayout'
import DownloadAppButton from './components/DownloadAppButton'

import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import FaceScanPage       from './pages/FaceScanPage'
import OTPPage            from './pages/OTPPage'
import DashboardPage      from './pages/DashboardPage'
import VaultPage          from './pages/VaultPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AnimatedBackground />
      <DownloadAppButton />

      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public – each page is relative z-10 via auth-page CSS class */}
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/face-scan"       element={<FaceScanPage />} />
            <Route path="/verify-otp"      element={<OTPPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />

            {/* Protected */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vault"     element={<VaultPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </AuthProvider>
  )
}
