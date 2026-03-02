import { useState } from 'react'
import Navbar from './Navbar'
import { Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-whiten">
      
      {/* Fondo oscuro en móvil cuando el menú está abierto */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Menú lateral (Sidebar) */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Área principal de contenido */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        
        {/* Cabecera superior (Header) estilo TailAdmin */}
        <header className="sticky top-0 z-30 flex w-full bg-white shadow-sm">
          <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-11">
            
            {/* Botón de menú móvil */}
            <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSidebarOpen(!sidebarOpen)
                }}
                className="z-50 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm lg:hidden"
              >
                <Menu className="w-5 h-5 text-black" />
              </button>
            </div>

            {/* Espacio en blanco a la izquierda en PC para equilibrar */}
            <div className="hidden sm:block"></div>

            {/* Información del usuario a la derecha */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-bold text-black">
                  {user?.nombre} {user?.apellidos}
                </span>
                <span className="block text-xs font-medium text-body capitalize">
                  {user?.rol === 'rrhh' ? 'RRHH' : user?.rol}
                </span>
              </div>
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                {user?.nombre?.[0]}{user?.apellidos?.[0]}
              </div>
            </div>

          </div>
        </header>

        {/* Renderizado de la página (Dashboards, etc) */}
        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}