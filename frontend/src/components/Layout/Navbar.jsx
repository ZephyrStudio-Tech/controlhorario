import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Clock, Users, FileText, Calendar, LayoutDashboard,
  ClipboardList, Menu, X, LogOut,
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
    user?.rol === 'admin' ? adminLinks
    : user?.rol === 'rrhh' ? hrLinks
    : workerLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile top bar */}
      <header style={{
        backgroundColor: 'var(--surface-card)',
        borderBottom: '1px solid var(--surface-border)',
      }} className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Control Horario
          </span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Abrir menú"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-transform duration-200
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          top-14 lg:top-0
        `}
        style={{
          backgroundColor: 'var(--surface-card)',
          borderRight: '1px solid var(--surface-border)',
        }}
      >
        {/* Logo — solo desktop */}
        <div
          className="hidden lg:flex items-center gap-3 px-5 h-16"
          style={{ borderBottom: '1px solid var(--surface-border)' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--primary)' }}>
            <Clock className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            Control Horario
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-0.5">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={active ? {
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                    } : {
                      color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--surface)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = ''
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }
                    }}
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
        <div className="p-4" style={{ borderTop: '1px solid var(--surface-border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}
            >
              {user?.nombre?.[0]}{user?.apellidos?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.nombre} {user?.apellidos}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {roleLabels[user?.rol]}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#fef2f2'
              e.currentTarget.style.color = '#dc2626'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = ''
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}