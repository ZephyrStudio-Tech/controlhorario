import { useState, useEffect } from 'react'
import { getMySessions } from '../../api/sessions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../components/UI/Badge'
import { ChevronDown, ChevronUp, MapPin, Monitor } from 'lucide-react'

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

function SessionRow({ s }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p className="font-medium text-text-primary text-sm">
            {format(new Date(s.fecha_entrada), "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {format(new Date(s.fecha_entrada), 'HH:mm')}
            {s.fecha_salida ? ` → ${format(new Date(s.fecha_salida), 'HH:mm')}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {s.horas_netas != null && (
            <span className="text-sm font-semibold text-text-primary">{s.horas_netas}h</span>
          )}
          <Badge value={s.estado} />
          {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </button>

      {expanded && (
          <div className="px-5 pb-5 border-t border-surface-border pt-4 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-text-muted">Horas extra</span>
              <p className="font-semibold text-text-primary">{s.horas_extra ?? '—'}h</p>
            </div>
            <div>
              <span className="text-text-muted">Pausas</span>
              <p className="font-semibold text-text-primary">{s.pauses?.length ?? 0}</p>
            </div>
          </div>
          {s.pauses?.length > 0 && (
            <div>
              <p className="text-xs text-text-muted mb-1">Pausas</p>
              {s.pauses.map((p) => <PauseRow key={p.id} pause={p} />)}
            </div>
          )}
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
          {s.geolocalizacion_denegada_entrada && (
            <p className="text-xs text-amber-600">Geolocalización denegada en la entrada</p>
          )}
          {s.modificado_por && (
            <p className="text-xs text-red-500">Modificado por un administrador</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function MyRecords() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = () => {
    setLoading(true)
    const params = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    getMySessions(params)
      .then((res) => setSessions(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Mis Registros</h1>
        <p className="text-text-muted text-sm mt-1">Consulta el historial de tus fichajes.</p>
      </div>

      {/* Filters */}
      <div className="card p-5 flex flex-wrap gap-3">
        <div>
          <label className="label">Desde</label>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="self-end">
          <button className="btn-primary" onClick={load}>Buscar</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-text-muted">No hay registros en ese periodo</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => <SessionRow key={s.id} s={s} />)}
        </div>
      )}
    </div>
  )
}
