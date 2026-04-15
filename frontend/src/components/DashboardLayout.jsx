import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, FolderLock, LayoutDashboard, Radio, Search, Shield, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

const mobileLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vault', icon: FolderLock, label: 'Vault' },
]

export default function DashboardLayout() {
  const [expanded, setExpanded] = useState(true)
  const { user } = useAuth()
  const loc = useLocation()

  return (
    <div className="relative z-10 min-h-screen text-vault-text">
      <div className="flex min-h-screen">
        <Sidebar expanded={expanded} onToggle={() => setExpanded((value) => !value)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <motion.header
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            className="topbar"
          >
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <Link to="/dashboard" className="brand-mark">
                <Shield className="h-5 w-5" />
              </Link>
              <div>
                <div className="text-sm font-bold text-white">SecureVault</div>
                <div className="text-xs text-vault-muted">Security console</div>
              </div>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-vault-muted shadow-inner md:flex">
              <Search className="h-4 w-4 text-cyan-200/70" />
              <span>Search vault files, login events, alerts</span>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 sm:flex">
                <Radio className="h-4 w-4 animate-pulse" />
                Secure session
              </div>
              <button type="button" className="icon-button relative" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.9)]" />
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1.5 sm:px-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/10 text-cyan-100">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-white">{user?.username || 'Operator'}</div>
                  <div className="text-[11px] text-vault-muted">MFA verified</div>
                </div>
              </div>
            </div>
          </motion.header>

          <nav className="mobile-nav lg:hidden">
            {mobileLinks.map(({ to, icon: Icon, label }) => {
              const active = loc.pathname === to
              return (
                <Link key={to} to={to} className={`mobile-nav-link ${active ? 'mobile-nav-link-active' : ''}`}>
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
