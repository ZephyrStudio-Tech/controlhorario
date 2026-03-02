import { useState, useEffect, Fragment } from 'react'
import { getAllSessions } from '../../api/sessions'
import { getSimpleUsers } from '../../api/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../components/UI/Badge'
import { Monitor, MapPin, Search, ChevronDown, ChevronUp } from 'lucide-react'

// Componente para cada Fila de la tabla (Desplegable de Línea de Tiempo)
function SessionRow({ s }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Fragment>
      {/* Fila principal visible siempre */}
      <tr className={`transition-colors hover:bg-gray-50 ${expanded ? 'bg-gray-50' : 'border-b border-stroke'}`}>
        {/* Trabajador */}
        <td className="py-4 px-6">
          <div className="flex flex-col">
            <p className="font-bold text-black text-sm">
              {s.user?.nombre} {s.user?.apellidos}
            </p>
            <p className="text-xs text-body mt-0.5 capitalize">
              {s.user?.rol === 'rrhh' ? 'RRHH' : s.user?.rol}
            </p>
          </div>
        </td>

        {/* Fecha */}
        <td className="py-4 px-6 text-sm font-medium text-black capitalize">
          {format(new Date(s.fecha_entrada), "EEEE d MMM yyyy", { locale: es })}
        </td>

        {/* Entrada */}
        <td className="py-4 px-6">
          <p className="text-sm font-medium text-black">{format(new Date(s.fecha_entrada), 'HH:mm')}</p>
        </td>

        {/* Salida */}
        <td className="py-4 px-6">
          <p className="text-sm font-medium text-black">
            {s.fecha_salida ? format(new Date(s.fecha_salida), 'HH:mm') : '—'}
          </p>
        </td>

        {/* Horas Netas */}
        <td className="py-4 px-6 text-center">
          <span className="inline-flex items-center justify-center bg-white px-2 py-1 rounded text-sm font-bold text-black border border-stroke">
            {s.horas_netas ? `${s.horas_netas}h` : '—'}
          </span>
        </td>

        {/* Estado */}
        <td className="py-4 px-6">
          <div className="flex flex-col items-start gap-1">
            <Badge value={s.estado} />
            {s.modificado_por && (
              <span className="text-[10px] text-amber-600 font-medium">* Modificado admin</span>
            )}
          </div>
        </td>

        {/* Acciones */}
        <td className="py-4 px-6 text-right">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center justify-center gap-1 bg-white border border-stroke text-body hover:text-primary px-3 py-1.5 rounded-md text-xs font-semibold transition-colors w-full sm:w-auto"
          >
            {expanded ? 'Ocultar' : 'Detalles'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </td>
      </tr>

      {/* Fila Desplegable con la Línea de Tiempo (Timeline) */}
      {expanded && (
        <tr className="bg-slate-50 border-b border-stroke">
          <td colSpan="7" className="py-6 px-8">
            <div className="ml-2 pl-6 border-l-2 border-stroke space-y-6">
              
              {/* Evento 1: Entrada */}
              <div className="relative">
                <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-success ring-4 ring-success-light"></div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-bold text-black flex items-center gap-2">
                    Fichaje de Entrada
                    <span className="text-xs font-medium text-body bg-white border border-stroke px-2 py-0.5 rounded">
                      {format(new Date(s.fecha_entrada), 'HH:mm:ss')}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-body">
                    {s.ip_entrada ? (
                      <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> IP: {s.ip_entrada}</span>
                    ) : (
                      <span className="text-gray-400 italic">IP no registrada</span>
                    )}
                    
                    {s.lat_entrada && s.lon_entrada && (
                      <a 
                        href={`https://www.google.com/maps?q=${s.lat_entrada},${s.lon_entrada}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Ver en mapa ({Number(s.lat_entrada).toFixed(4)}, {Number(s.lon_entrada).toFixed(4)})
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Eventos Intermedios: Pausas */}
              {s.pauses?.map((p) => (
                <div key={p.id} className="relative">
                  <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-warning ring-4 ring-warning-light"></div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-bold text-black flex items-center gap-2 capitalize">
                      Pausa: {p.tipo.replace(/_/g, ' ')}
                      <span className="text-xs font-medium text-body bg-white border border-stroke px-2 py-0.5 rounded">
                        {format(new Date(p.inicio_pausa), 'HH:mm:ss')} → {p.fin_pausa ? format(new Date(p.fin_pausa), 'HH:mm:ss') : 'En curso'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}

              {/* Evento Final: Salida */}
              {s.fecha_salida ? (
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-danger ring-4 ring-danger-light"></div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-bold text-black flex items-center gap-2">
                      Fichaje de Salida
                      <span className="text-xs font-medium text-body bg-white border border-stroke px-2 py-0.5 rounded">
                        {format(new Date(s.fecha_salida), 'HH:mm:ss')}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-body ring-4 ring-gray-200"></div>
                  <p className="text-sm font-medium text-body italic">Jornada abierta (Sin salida)</p>
                </div>
              )}

            </div>
          </td>
        </tr>
      )}
    </Fragment>
  )
}


export default function HRRecords() {
  const [sessions, setSessions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ user_id: '', start_date: '', end_date: '', estado: '' })

  const load = () => {
    setLoading(true)
    const params = {}
    if (filters.user_id) params.user_id = filters.user_id
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date
    if (filters.estado) params.estado = filters.estado
    
    getAllSessions(params)
      .then((res) => setSessions(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getSimpleUsers().then((res) => setUsers(res.data))
    load()
  }, [])

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Registros de Jornada</h1>
        <p className="text-sm mt-1 text-text-muted">
          Audita y consulta los fichajes de los trabajadores (Modo Solo Lectura).
        </p>
      </div>

      {/* Tarjeta de Filtros */}
      <div className="rounded-sm border border-stroke bg-white shadow-default p-6">
        <h3 className="font-semibold text-black mb-4 text-sm uppercase tracking-wider">Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="mb-2.5 block text-black font-medium text-sm">Trabajador</label>
            <select className="input" value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}>
              <option value="">Todos los usuarios</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
            </select>
          </div>
          
          <div className="lg:col-span-1">
            <label className="mb-2.5 block text-black font-medium text-sm">Estado</label>
            <select className="input" value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
              <option value="">Todos los estados</option>
              <option value="abierta">Abierta</option>
              <option value="en_pausa">En pausa</option>
              <option value="cerrada">Cerrada</option>
              <option value="incompleta">Incompleta</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-2.5 block text-black font-medium text-sm">Desde</label>
            <input type="date" className="input" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          
          <div className="lg:col-span-1">
            <label className="mb-2.5 block text-black font-medium text-sm">Hasta</label>
            <input type="date" className="input" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
          </div>

          <div className="lg:col-span-1">
            <button className="btn-primary w-full py-3" onClick={load}>
              <Search className="w-5 h-5" />
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="rounded-sm border border-stroke bg-white shadow-default overflow-hidden">
        <div className="border-b border-stroke py-4 px-6">
          <h3 className="font-semibold text-black text-lg">
            Listado de Sesiones <span className="text-sm font-normal text-body ml-2">({sessions.length} encontrados)</span>
          </h3>
        </div>

        <div className="max-w-full overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-body">
              <p>No se encontraron registros con estos filtros.</p>
            </div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-whiten text-left">
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[200px]">Trabajador</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[150px]">Día</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[120px]">Entrada</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[120px]">Salida</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[100px] text-center">Netas</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[120px]">Estado</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <SessionRow key={s.id} s={s} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}