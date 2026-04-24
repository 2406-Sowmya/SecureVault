import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AnimatedBackground from './components/AnimatedBackground'
import DashboardLayout from './components/DashboardLayout'
import DownloadAppButton from './components/DownloadAppButton'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FaceScanPage from './pages/FaceScanPage'
import OTPPage from './pages/OTPPage'
import DashboardPage from './pages/DashboardPage'
import VaultPage from './pages/VaultPage'
import NotificationsPage from './pages/NotificationsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function LoginRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
}

function RegisterRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('Route loaded:', location.pathname)
  }, [location.pathname])

  useEffect(() => {
    const viewingProtectedRoute = ['/dashboard', '/vault', '/notifications']
      .some((path) => location.pathname.startsWith(path))

    if (!isAuthenticated && viewingProtectedRoute) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, location.pathname, navigate])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/register'} replace />}
        />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route path="/face" element={<FaceScanPage />} />
        <Route path="/face-scan" element={<Navigate to="/face" replace />} />
        <Route path="/verify-otp" element={<OTPPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/register'} replace />}
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedBackground />
        <DownloadAppButton />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
