import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Clock, Users, FileText, Calendar, LayoutDashboard,
  ClipboardList, Menu, X, LogOut, ChevronDown,
} from 'lucide-react'

const workerLinks = [
  { to: '/worker', label: 'Inicio', icon: LayoutDashboard },
  { to: '/worker/records', label: 'Mis Registros', icon: Clock },
  { to: '/worker/absences', label: 'Ausencias', icon: Calendar },
  { to: '/worker/documents', label: 'Documentos', icon: FileText },
]

const hrLinks = [
  { to: '/hr', label: 'Inicio', icon: LayoutDashboard },
  { to: '/hr/records', label: 'Registros', icon: ClipboardList },
  { to: '/hr/absences', label: 'Ausencias', icon: Calendar },
  { to: '/hr/documents', label: 'Documentos', icon: FileText },
]

const adminLinks = [
  { to: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
  { to: '/admin/records', label: 'Registros', icon: ClipboardList },
  { to: '/admin/absences', label: 'Ausencias', icon: Calendar },
  { to: '/admin/documents', label: 'Documentos', icon: FileText },
  { to: '/admin/reports', label: 'Informes', icon: FileText },
]

const roleLabels = { admin: 'Admin', rrhh: 'RRHH', worker: 'Trabajador' }

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const links =
    user?.rol === 'admin'
      ? adminLinks
      : user?.rol === 'rrhh'
        ? hrLinks
        : workerLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface-card border-b border-surface-border h-14 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span className="font-semibold text-text-primary text-sm">Control Horario</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-surface"
          aria-label="Abrir menú"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-surface-card border-r border-surface-border z-40
          flex flex-col transition-transform duration-200
          lg:translate-x-0 lg:top-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          top-14 lg:top-0
        `}
      >
        {/* Logo */}
        <div className="hidden lg:flex items-center gap-2 px-5 h-16 border-b border-surface-border">
          <Clock className="w-6 h-6 text-primary" />
          <span className="font-bold text-text-primary">Control Horario</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${active
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t border-surface-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {user?.nombre?.[0]}{user?.apellidos?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {user?.nombre} {user?.apellidos}
              </p>
              <p className="text-xs text-text-muted">{roleLabels[user?.rol]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
