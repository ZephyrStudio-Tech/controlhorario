import { useState, useEffect } from 'react'
import { getUsersStats } from '../../api/users'
import { getPendingAbsences } from '../../api/absences'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Coffee, LogOut, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-6 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold leading-none mb-1.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

export default function HRDashboard() {
  const [stats, setStats] = useState(null)
  const [pendingAbsences, setPendingAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getUsersStats(),
      getPendingAbsences(),
    ]).then(([statsRes, absRes]) => {
      setStats(statsRes.data)
      setPendingAbsences(absRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Panel de RRHH</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {stats && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Estado del día</p>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={Clock}  label="Trabajando ahora" value={stats.activos_hoy ?? 0}  color="bg-green-100 text-green-700" />
            <StatCard icon={Coffee} label="En pausa"         value={stats.en_pausa ?? 0}     color="bg-amber-100 text-amber-700" />
            <StatCard icon={LogOut} label="Han salido"       value={stats.han_salido ?? 0}   color="bg-blue-100 text-blue-700" />
            <StatCard icon={UserX}  label="Sin fichar"       value={stats.sin_fichar ?? 0}   color="bg-slate-100 text-slate-500" />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Ausencias pendientes
            {pendingAbsences.length > 0 && (
              <span className="ml-2 text-white text-xs font-bold rounded-full px-2 py-0.5" style={{ backgroundColor: 'var(--primary)' }}>
                {pendingAbsences.length}
              </span>
            )}
          </p>
          <button
            className="text-xs font-medium"
            style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => navigate('/hr/absences')}
          >
            Ver todas
          </button>
        </div>
        {pendingAbsences.length === 0 ? (
          <div className="card p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay solicitudes pendientes
          </div>
        ) : (
          <div className="space-y-2">
            {pendingAbsences.slice(0, 5).map((a) => (
              <div key={a.id} className="card px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {a.user?.nombre} {a.user?.apellidos}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {a.tipo.replace(/_/g, ' ')} · {format(new Date(a.fecha_inicio + 'T00:00:00'), 'd MMM', { locale: es })}
                    {' → '}{format(new Date(a.fecha_fin + 'T00:00:00'), 'd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <button
                  className="text-xs font-medium flex-shrink-0"
                  style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => navigate('/hr/absences')}
                >
                  Revisar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}