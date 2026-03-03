import { useState, useEffect } from 'react'
import { getLogs } from '../../api/logs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Activity, Key, Clock, FileDown, Edit, Monitor, Play, Square, Search, AlertCircle, EyeOff, Eye } from 'lucide-react'

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
  const [hideAdmin, setHideAdmin] = useState(false) // Nuevo estado para el filtro

  useEffect(() => {
    getLogs({ limit: 300 })
      .then((res) => setLogs(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Error cargando logs:", err))
      .finally(() => setLoading(false))
  }, [])

  // Lógica combinada de filtrado (Búsqueda + Ocultar Admin)
  const filteredLogs = logs.filter(log => {
    // 1. Filtrar los del admin si el botón está activado
    if (hideAdmin && log.user?.rol === 'admin') {
      return false;
    }

    // 2. Filtrar por término de búsqueda
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.user?.nombre || '').toLowerCase().includes(searchLower) ||
      (log.user?.apellidos || '').toLowerCase().includes(searchLower) ||
      (log.accion || '').toLowerCase().includes(searchLower) ||
      (log.detalles || '').toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Registro de Auditoría
        </h1>
        <p className="text-sm mt-1 text-body">Historial de acciones del sistema.</p>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          {/* Barra de Búsqueda */}
          <div className="relative w-full sm:max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-gray-50 border border-stroke rounded-md py-3 pl-12 pr-4 text-sm focus:border-primary outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Botón Ocultar Admin */}
          <button
            onClick={() => setHideAdmin(!hideAdmin)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors border ${
              hideAdmin 
                ? 'bg-primary/10 border-primary/20 text-primary' 
                : 'bg-white border-stroke text-body hover:bg-gray-50'
            }`}
          >
            {hideAdmin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {hideAdmin ? 'Mostrar registros de Admin' : 'Ocultar registros de Admin'}
          </button>
          
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-body">
              <p>No se encontraron registros con estos filtros.</p>
            </div>
          ) : (
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-stroke text-xs uppercase text-black font-bold">
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-6">Acción</th>
                  <th className="py-4 px-6">Detalles</th>
                  <th className="py-4 px-6">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const config = ACTION_STYLES[log.accion] || { label: log.accion, icon: AlertCircle, color: 'text-gray-500 bg-gray-100' };
                  const LogIcon = config.icon;

                  return (
                    <tr key={log.id} className="border-b border-stroke hover:bg-gray-50 text-sm">
                      <td className="py-3 px-6">
                        <div className="text-black font-medium">{format(new Date(log.created_at), "dd/MM/yyyy")}</div>
                        <div className="text-xs text-body">{format(new Date(log.created_at), "HH:mm:ss")}</div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="font-bold text-black">{log.user?.nombre} {log.user?.apellidos}</div>
                        <div className="text-[10px] uppercase text-body">{log.user?.rol}</div>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${config.color}`}>
                          <LogIcon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-black">{log.detalles}</td>
                      <td className="py-3 px-6 font-mono text-xs">{log.ip_address || '—'}</td>
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
