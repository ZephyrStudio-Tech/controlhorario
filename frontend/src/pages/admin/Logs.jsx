import { useState, useEffect } from 'react'
import { getLogs } from '../../api/logs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Activity, Key, Clock, FileDown, Edit, Monitor, Play, Square, Search } from 'lucide-react'

// Mapeo visual de acciones (Iconos, colores y textos amigables)
const ACTION_STYLES = {
  'LOGIN_EMAIL': { label: 'Login (Email)', icon: Key, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'LOGIN_DNI': { label: 'Login (DNI)', icon: Key, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  'CLOCK_IN': { label: 'Entrada', icon: Clock, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'CLOCK_OUT': { label: 'Salida', icon: Clock, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  'PAUSE_START': { label: 'Inicio Pausa', icon: Play, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'PAUSE_END': { label: 'Fin Pausa', icon: Square, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'ADMIN_EDIT_SESSION': { label: 'Edición Admin', icon: Edit, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  'REPORT_EXPORT': { label: 'Exportación', icon: FileDown, color: 'text-purple-600 bg-purple-50 border-purple-200' },
}

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Por defecto pedimos los últimos 300 eventos
    getLogs({ limit: 300 })
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Filtro rápido de búsqueda en el frontend
  const filteredLogs = logs.filter(log => 
    log.user?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.detalles && log.detalles.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-8">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Registro de Auditoría (Logs)
        </h1>
        <p className="text-sm mt-1 text-text-muted">
          Historial inmutable de todas las acciones, accesos y modificaciones en el sistema.
        </p>
      </div>

      {/* Buscador */}
      <div className="rounded-sm border border-stroke bg-white shadow-default p-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Buscar por empleado, acción o detalle..."
            className="w-full bg-gray-50 border border-stroke rounded-md py-3 pl-12 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="rounded-sm border border-stroke bg-white shadow-default overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-body text-sm">
              No hay registros de actividad que coincidan con la búsqueda.
            </div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-whiten text-left">
                  <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider min-w-[180px]">Fecha y Hora</th>
                  <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider min-w-[180px]">Usuario</th>
                  <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider min-w-[180px]">Acción</th>
                  <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider min-w-[250px]">Detalles</th>
                  <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider min-w-[120px]">IP Origen</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const style = ACTION_STYLES[log.accion] || { label: log.accion, icon: Activity, color: 'text-gray-600 bg-gray-50 border-gray-200' }
                  const Icon = style.icon

                  return (
                    <tr key={log.id} className={`${index !== filteredLogs.length - 1 ? 'border-b border-stroke' : ''} hover:bg-gray-50`}>
                      
                      {/* Fecha */}
                      <td className="py-3 px-6">
                        <p className="font-semibold text-black text-sm">
                          {format(new Date(log.created_at), "dd MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-body">
                          {format(new Date(log.created_at), "HH:mm:ss")}
                        </p>
                      </td>

                      {/* Usuario */}
                      <td className="py-3 px-6">
                        {log.user ? (
                          <>
                            <p className="font-bold text-black text-sm">{log.user.nombre} {log.user.apellidos}</p>
                            <p className="text-[10px] text-body uppercase tracking-wider">{log.user.rol}</p>
                          </>
                        ) : (
                          <span className="text-sm italic text-gray-400">Sistema / Desconocido</span>
                        )}
                      </td>

                      {/* Acción (Badge) */}
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${style.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {style.label}
                        </span>
                      </td>

                      {/* Detalles */}
                      <td className="py-3 px-6 text-sm text-black">
                        {log.detalles || '—'}
                      </td>

                      {/* IP Address */}
                      <td className="py-3 px-6">
                        {log.ip_address ? (
                          <div className="flex items-center gap-1 text-xs text-body font-mono bg-gray-100 px-2 py-1 rounded w-fit">
                            <Monitor className="w-3 h-3 text-gray-400" />
                            {log.ip_address}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No registrada</span>
                        )}
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}