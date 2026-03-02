import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Clock, Users, FileText, Calendar, LayoutDashboard,
  ClipboardList, LogOut, X
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

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-boxdark duration-300 ease-linear lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* HEADER DEL SIDEBAR */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 mt-4 mb-2">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Horario</span>
        </Link>

        {/* Botón cerrar en móvil */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="block lg:hidden text-[#AEB7C0] hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* ENLACES DEL SIDEBAR */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear h-full">
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-[#8A99AF]">
              MENÚ PRINCIPAL
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {links.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={`group relative flex items-center gap-2.5 rounded-sm py-2.5 px-4 font-medium text-[#DEE4EE] duration-300 ease-in-out hover:bg-[#333A48] ${
                        active ? 'bg-[#333A48] text-white' : ''
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#8A99AF] group-hover:text-white'}`} />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
        
        {/* BOTÓN CERRAR SESIÓN (Abajo del todo) */}
        <div className="mt-auto mb-10 px-6">
          <button
            onClick={handleLogout}
            className="group relative flex w-full items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-[#DEE4EE] duration-300 ease-in-out hover:bg-[#333A48] hover:text-white"
          >
            <LogOut className="w-5 h-5 text-[#8A99AF] group-hover:text-white" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  )
}