// ─── ProtectedRoute.jsx ───────────────────────────────────────────────────────
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// ─── Navbar.jsx ───────────────────────────────────────────────────────────────
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, LayoutDashboard, FolderLock,
  LogOut, User, ChevronRight
} from 'lucide-react'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const loc              = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vault',     icon: FolderLock,       label: 'Vault'     },
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      className="sticky top-0 z-50 bg-vault-panel/80 backdrop-blur-xl
                 border-b border-vault-border px-6 py-3"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-vault-accent/10 group-hover:bg-vault-accent/20 transition">
            <Shield className="w-5 h-5 text-vault-accent" />
          </div>
          <span className="font-bold text-lg gradient-text">SecureVault</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                         font-medium transition-all duration-150
                         ${loc.pathname === to
                           ? 'bg-vault-accent/10 text-vault-accent'
                           : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-vault-card border border-vault-border">
            <User className="w-4 h-4 text-vault-accent" />
            <span className="text-sm font-medium">{user?.username}</span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                       font-medium text-vault-muted hover:text-vault-accent2
                       hover:bg-red-500/10 transition-all duration-150">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </motion.nav>
  )
}
