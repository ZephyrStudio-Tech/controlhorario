import { useState, useEffect } from 'react'
import { getAllSessions, updateSession } from '../../api/sessions'
import { getAllUsers } from '../../api/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import { ChevronDown, ChevronUp, MapPin, Monitor, Edit2, AlertCircle } from 'lucide-react'

function PauseRow({ pause }) {
  return (
    <div className="flex items-center justify-between text-xs text-text-secondary bg-amber-50 rounded-lg px-3 py-1.5 mt-1">
      <span className="capitalize">{pause.tipo}</span>
      <span>
        {format(new Date(pause.inicio_pausa), 'HH:mm')}
        {pause.fin_pausa ? ` → ${format(new Date(pause.fin_pausa), 'HH:mm')}` : ' (activa)'}
      </span>
    </div>
  )
}

function SessionRow({ s, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary text-sm truncate">
            {s.user?.nombre} {s.user?.apellidos}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {format(new Date(s.fecha_entrada), "EEEE d MMM", { locale: es })}
            {' · '}{format(new Date(s.fecha_entrada), 'HH:mm')}
            {s.fecha_salida ? ` → ${format(new Date(s.fecha_salida), 'HH:mm')}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {s.horas_netas != null && (
            <span className="text-sm font-semibold text-text-primary">{s.horas_netas}h</span>
          )}
          <Badge value={s.estado} />
          {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-border pt-3 space-y-2">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-text-muted">Horas netas</span>
              <p className="font-semibold text-text-primary">{s.horas_netas ?? '—'}h</p>
            </div>
            <div>
              <span className="text-text-muted">Horas extra</span>
              <p className="font-semibold text-text-primary">{s.horas_extra ?? '—'}h</p>
            </div>
            <div>
              <span className="text-text-muted">Pausas</span>
              <p className="font-semibold text-text-primary">{s.pauses?.length ?? 0}</p>
            </div>
          </div>
          {s.pauses?.length > 0 && s.pauses.map((p) => <PauseRow key={p.id} pause={p} />)}
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Monitor className="w-3 h-3" />
            IP: {s.ip_entrada || '—'}
          </div>
          {s.lat_entrada && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <MapPin className="w-3 h-3" />
              {Number(s.lat_entrada).toFixed(5)}, {Number(s.lon_entrada).toFixed(5)}
            </div>
          )}
          {s.modificado_por && (
            <p className="text-xs text-amber-600">Modificado por un administrador</p>
          )}
          <div className="pt-1">
            <button
              className="btn-secondary text-xs flex items-center gap-1.5"
              onClick={() => onEdit(s)}
            >
              <Edit2 className="w-3 h-3" />
              Editar registro
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminRecords() {
  const [sessions, setSessions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ user_id: '', start_date: '', end_date: '', estado: '' })
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Registros de jornada</h1>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Trabajador</label>
            <select className="input" value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}>
              <option value="">Todos</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
              <option value="">Todos</option>
              <option value="abierta">Abierta</option>
              <option value="en_pausa">En pausa</option>
              <option value="cerrada">Cerrada</option>
              <option value="incompleta">Incompleta</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
          </div>
        </div>
        <button className="btn-primary w-full" onClick={load}>Buscar</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-text-muted">No hay registros</div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">{sessions.length} registros</p>
          {sessions.map((s) => <SessionRow key={s.id} s={s} onEdit={openEdit} />)}
        </div>
      )}

      {editing && (
        <Modal title="Editar registro" onClose={() => setEditing(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
              Editando el registro de <span className="font-semibold">{editing.user?.nombre} {editing.user?.apellidos}</span>.
              Los cambios quedan registrados con tu usuario.
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
              <label className="label">Estado</label>
              <select className="input" value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}>
                <option value="abierta">Abierta</option>
                <option value="en_pausa">En pausa</option>
                <option value="cerrada">Cerrada</option>
                <option value="incompleta">Incompleta</option>
              </select>
            </div>
            {editError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {editError}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" className="btn-secondary flex-1" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="btn-primary flex-1" disabled={editSubmitting}>
                {editSubmitting
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Guardar cambios'
                }
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
