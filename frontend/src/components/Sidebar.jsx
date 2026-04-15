import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  FolderLock,
  LayoutDashboard,
  LogOut,
  Shield,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vault', icon: FolderLock, label: 'Vault' },
]

export default function Sidebar({ expanded, onToggle }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: expanded ? 264 : 84 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="dashboard-sidebar hidden lg:flex"
    >
      <div className="flex h-full flex-col p-4">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="brand-mark">
              <Shield className="h-5 w-5" />
            </div>
            {expanded && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="min-w-0">
                <div className="truncate text-base font-bold text-white">SecureVault</div>
                <div className="text-xs text-cyan-200/70">Zero-trust console</div>
              </motion.div>
            )}
          </Link>
          <button type="button" onClick={onToggle} className="icon-button" aria-label="Toggle sidebar">
            {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        <nav className="space-y-2">
          {links.map(({ to, icon: Icon, label }) => {
            const active = loc.pathname === to
            return (
              <Link key={to} to={to} className={`sidebar-link ${active ? 'sidebar-link-active' : ''}`}>
                <Icon className="h-5 w-5 shrink-0" />
                {expanded && <span>{label}</span>}
                {active && <motion.span layoutId="active-pill" className="sidebar-active-glow" />}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Activity className="h-4 w-4" />
              {expanded && <span>Systems online</span>}
            </div>
            {expanded && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300"
                animate={{ width: ['42%', '91%', '64%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>}
          </div>

          <button type="button" className="sidebar-link w-full">
            <Bell className="h-5 w-5 shrink-0" />
            {expanded && <span>Notifications</span>}
          </button>
          <button type="button" onClick={handleLogout} className="sidebar-link w-full hover:text-rose-200">
            <LogOut className="h-5 w-5 shrink-0" />
            {expanded && <span>Logout</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
