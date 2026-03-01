import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Clock, Users, FileText, Calendar, LayoutDashboard,
  ClipboardList, Menu, X, LogOut,
} from 'lucide-react'

const workerLinks = [
  { to: '/worker',           label: 'Inicio',       icon: LayoutDashboard },
  { to: '/worker/records',   label: 'Mis Registros', icon: Clock },
  { to: '/worker/absences',  label: 'Ausencias',    icon: Calendar },
  { to: '/worker/documents', label: 'Documentos',   icon: FileText },
]

const hrLinks = [
  { to: '/hr',           label: 'Inicio',      icon: LayoutDashboard },
  { to: '/hr/records',   label: 'Registros',   icon: ClipboardList },
  { to: '/hr/absences',  label: 'Ausencias',   icon: Calendar },
  { to: '/hr/documents', label: 'Documentos',  icon: FileText },
]

const adminLinks = [
  { to: '/admin',           label: 'Inicio',      icon: LayoutDashboard },
  { to: '/admin/users',     label: 'Usuarios',    icon: Users },
  { to: '/admin/records',   label: 'Registros',   icon: ClipboardList },
  { to: '/admin/absences',  label: 'Ausencias',   icon: Calendar },
  { to: '/admin/documents', label: 'Documentos',  icon: FileText },
  { to: '/admin/reports',   label: 'Informes',    icon: FileText },
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

  const handleLogout = () => { logout(); navigate('/login') }

  const sidebar = (
    <aside style={{
      width: '256px',
      backgroundColor: 'var(--sidebar-bg)',
      color: 'var(--sidebar-fg)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.75rem 1.5rem 1.25rem', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.5rem' }}>
        Control Horario
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0' }}>
        <ul style={{ listStyle: 'none' }}>
          {links.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <li key={to}>
                <Link
                  to={to}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem 0.625rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: active ? 500 : 400,
                    color: active ? '#ffffff' : 'var(--sidebar-muted)',
                    textDecoration: 'none',
                    position: 'relative',
                    backgroundColor: active ? 'rgba(70,118,205,0.18)' : 'transparent',
                    borderRadius: '0 10px 10px 0',
                    margin: '0.1rem 0.75rem 0.1rem 0',
                    transition: 'color 0.15s, background-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.color = '#ffffff'
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.color = 'var(--sidebar-muted)'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {/* Barra lateral activa */}
                  {active && (
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      height: '60%',
                      width: '3px',
                      backgroundColor: 'var(--sidebar-accent)',
                      borderTopRightRadius: '3px',
                      borderBottomRightRadius: '3px',
                    }} />
                  )}
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div style={{
        margin: '1rem',
        backgroundColor: 'var(--sidebar-note-bg)',
        borderRadius: '10px',
        padding: '1rem',
      }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem', color: '#fff' }}>
          {user?.nombre} {user?.apellidos}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--sidebar-muted)', marginBottom: '0.75rem' }}>
          {roleLabels[user?.rol]}
        </p>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: 'var(--sidebar-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-muted)'}
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile topbar */}
      <header
        className="lg:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
          backgroundColor: 'var(--sidebar-bg)', color: '#fff',
          height: '3.5rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 1rem',
        }}
      >
        <span style={{ fontWeight: 700 }}>Control Horario</span>
        <button
          onClick={() => setOpen(!open)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 35, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden" style={{ position: 'fixed', top: '3.5rem', left: 0, bottom: 0, zIndex: 40, width: '256px' }}>
          {sidebar}
        </div>
      )}
    </>
  )
}
