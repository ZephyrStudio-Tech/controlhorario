import { useState, useEffect } from 'react'
import { getAllSessions } from '../../api/sessions'
import { getSimpleUsers } from '../../api/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../components/UI/Badge'
import { ChevronDown, ChevronUp, MapPin, Monitor } from 'lucide-react'

function PauseRow({ pause }) {
  return (
    <div className="flex items-center justify-between text-xs rounded-lg px-3 py-1.5 mt-1"
      style={{ backgroundColor: '#fef3c7', color: 'var(--text-secondary)' }}>
      <span className="capitalize">{pause.tipo}</span>
      <span>
        {format(new Date(pause.inicio_pausa), 'HH:mm')}
        {pause.fin_pausa ? ` → ${format(new Date(pause.fin_pausa), 'HH:mm')}` : ' (activa)'}
      </span>
    </div>
  )
}

function SessionRow({ s }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {s.user?.nombre} {s.user?.apellidos}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {format(new Date(s.fecha_entrada), "EEEE d MMM", { locale: es })}
            {' · '}
            {format(new Date(s.fecha_entrada), 'HH:mm')}
            {s.fecha_salida ? ` → ${format(new Date(s.fecha_salida), 'HH:mm')}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 ml-3">
          {s.horas_netas != null && (
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.horas_netas}h</span>
          )}
          <Badge value={s.estado} />
          {expanded
            ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-4 space-y-2" style={{ borderTop: '1px solid var(--surface-border)' }}>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Horas netas</span>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.horas_netas ?? '—'}h</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Horas extra</span>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.horas_extra ?? '—'}h</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Pausas</span>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.pauses?.length ?? 0}</p>
            </div>
          </div>
          {s.pauses?.length > 0 && (
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Detalle de pausas</p>
              {s.pauses.map((p) => <PauseRow key={p.id} pause={p} />)}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Monitor className="w-3 h-3" />
            IP entrada: {s.ip_entrada || '—'}
          </div>
          {s.lat_entrada && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <MapPin className="w-3 h-3" />
              {Number(s.lat_entrada).toFixed(5)}, {Number(s.lon_entrada).toFixed(5)}
            </div>
          )}
        </div>
      )}
    </div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Registros de jornada</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Consulta los fichajes de todos los trabajadores.</p>
      </div>

      <div className="card p-5 space-y-4">
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
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No hay registros para los filtros seleccionados</div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sessions.length} registros encontrados</p>
          {sessions.map((s) => <SessionRow key={s.id} s={s} />)}
        </div>
      )}
    </div>
  )
}