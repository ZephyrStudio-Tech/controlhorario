import { useState, useEffect } from 'react'
import { getAllSessions, updateSession } from '../../api/sessions'
import { getAllUsers } from '../../api/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import { Monitor, MapPin, Edit2, AlertCircle, Search } from 'lucide-react'

export default function AdminRecords() {
  const [sessions, setSessions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estado para los filtros
  const [filters, setFilters] = useState({ user_id: '', start_date: '', end_date: '', estado: '' })
  
  // Estado para la edición
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editError, setEditError] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

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
    getAllUsers().then((res) => setUsers(res.data))
    load()
  }, [])

  const openEdit = (session) => {
    setEditing(session)
    setEditForm({
      fecha_entrada: session.fecha_entrada ? session.fecha_entrada.slice(0, 16) : '',
      fecha_salida: session.fecha_salida ? session.fecha_salida.slice(0, 16) : '',
      estado: session.estado,
    })
    setEditError('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditSubmitting(true)
    setEditError('')
    try {
      await updateSession(editing.id, {
        fecha_entrada: editForm.fecha_entrada ? new Date(editForm.fecha_entrada).toISOString() : undefined,
        fecha_salida: editForm.fecha_salida ? new Date(editForm.fecha_salida).toISOString() : undefined,
        estado: editForm.estado,
      })
      setEditing(null)
      load()
    } catch (err) {
      setEditError(err.response?.data?.message ?? 'Error al actualizar el registro.')
    } finally {
      setEditSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Registros de Jornada</h1>
        <p className="text-sm mt-1 text-text-muted">
          Consulta y edita los fichajes de todos los trabajadores de la empresa.
        </p>
      </div>

      {/* Tarjeta de Filtros (Estilo TailAdmin) */}
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

      {/* Tabla de Datos (Estilo TailAdmin) */}
      <div className="rounded-sm border border-stroke bg-white shadow-default overflow-hidden">
        
        {/* Cabecera de la tabla */}
        <div className="border-b border-stroke py-4 px-6">
          <h3 className="font-semibold text-black text-lg">
            Listado de Sesiones <span className="text-sm font-normal text-body ml-2">({sessions.length} encontrados)</span>
          </h3>
        </div>

        {/* Contenedor desplazable horizontalmente (para móviles) */}
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
                <tr className="bg-gray-2 text-left bg-whiten">
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[200px]">Trabajador</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[150px]">Fecha y Día</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[120px]">Entrada</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[120px]">Salida</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[100px] text-center">Netas</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[120px]">Estado</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, index) => (
                  <tr key={s.id} className={`${index !== sessions.length - 1 ? 'border-b border-stroke' : ''} hover:bg-gray-50 transition-colors`}>
                    
                    {/* Trabajador */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <p className="font-bold text-black text-sm">{s.user?.nombre} {s.user?.apellidos}</p>
                        <p className="text-xs text-body mt-0.5 capitalize">{s.user?.rol === 'rrhh' ? 'RRHH' : s.user?.rol}</p>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-4 px-6 text-sm font-medium text-black capitalize">
                      {format(new Date(s.fecha_entrada), "EEEE d MMM yyyy", { locale: es })}
                    </td>

                    {/* Entrada */}
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-black">{format(new Date(s.fecha_entrada), 'HH:mm')}</p>
                      {s.ip_entrada && (
                        <p className="text-[10px] text-body mt-1 flex items-center gap-1" title="Dirección IP y GPS">
                          <Monitor className="w-3 h-3" /> {s.ip_entrada}
                        </p>
                      )}
                    </td>

                    {/* Salida */}
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-black">
                        {s.fecha_salida ? format(new Date(s.fecha_salida), 'HH:mm') : '—'}
                      </p>
                    </td>

                    {/* Horas Netas */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-gray-100 px-2 py-1 rounded text-sm font-bold text-black border border-stroke">
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

                    {/* Acción */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center justify-center gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Edición (Mantenemos tu lógica, pero con clases Tailwind limpias) */}
      {editing && (
        <Modal title="Editar registro" onClose={() => setEditing(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="bg-warning/10 border border-warning/20 rounded-sm px-4 py-3 text-sm text-warning-fg mb-4">
              <span className="font-bold flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4" /> Editando Registro
              </span>
              Se va a modificar la jornada de <b>{editing.user?.nombre} {editing.user?.apellidos}</b>. Esta acción quedará registrada en el sistema.
            </div>

            <div>
              <label className="label">Fecha y hora de entrada</label>
              <input
                type="datetime-local"
                className="input"
                value={editForm.fecha_entrada}
                onChange={(e) => setEditForm({ ...editForm, fecha_entrada: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="label">Fecha y hora de salida (opcional)</label>
              <input
                type="datetime-local"
                className="input"
                value={editForm.fecha_salida}
                onChange={(e) => setEditForm({ ...editForm, fecha_salida: e.target.value })}
              />
            </div>
            
            <div>
              <label className="label">Estado de la jornada</label>
              <select className="input" value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}>
                <option value="abierta">Abierta (Trabajando)</option>
                <option value="en_pausa">En pausa</option>
                <option value="cerrada">Cerrada (Finalizada)</option>
                <option value="incompleta">Incompleta (Falta salida)</option>
              </select>
            </div>

            {editError && (
              <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-sm px-4 py-3 text-sm text-danger">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {editError}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-stroke mt-6">
              <button type="button" className="btn-secondary w-full" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary w-full" disabled={editSubmitting}>
                {editSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}