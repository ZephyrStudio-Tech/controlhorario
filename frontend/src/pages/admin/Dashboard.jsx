import { useState, useEffect } from 'react'
import { getUsersStats } from '../../api/users'
import { getPendingAbsences } from '../../api/absences'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Coffee, LogOut, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold leading-none mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function QuickLink({ label, description, path, navigate }) {
  return (
    <button
      onClick={() => navigate(path)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'var(--surface-card)',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</p>
    </button>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [pendingAbsences, setPendingAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getUsersStats(), getPendingAbsences()])
      .then(([statsRes, absRes]) => {
        setStats(statsRes.data)
        setPendingAbsences(absRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Panel de Administración
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <section>
        <p className="section-heading">Estado del día</p>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Clock}  label="Trabajando ahora" value={stats?.activos_hoy ?? 0}  color="bg-emerald-100 text-emerald-700" />
          <StatCard icon={Coffee} label="En pausa"         value={stats?.en_pausa ?? 0}     color="bg-amber-100 text-amber-700" />
          <StatCard icon={LogOut} label="Han salido"       value={stats?.han_salido ?? 0}   color="bg-blue-100 text-blue-700" />
          <StatCard icon={UserX}  label="Sin fichar"       value={stats?.sin_fichar ?? 0}   color="bg-slate-100 text-slate-500" />
        </div>
      </section>

      {/* Acceso rápido */}
      <section>
        <p className="section-heading">Acceso rápido</p>
        <div className="grid grid-cols-2 gap-4">
          <QuickLink label="Usuarios"  description="Gestionar trabajadores y roles" path="/admin/users"    navigate={navigate} />
          <QuickLink label="Registros" description="Ver y editar jornadas"          path="/admin/records"  navigate={navigate} />
          <QuickLink label="Ausencias" description="Aprobar solicitudes"            path="/admin/absences" navigate={navigate} />
          <QuickLink label="Informes"  description="Exportar CSV y PDF"             path="/admin/reports"  navigate={navigate} />
        </div>
      </section>

      {/* Ausencias pendientes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="section-heading mb-0" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Ausencias pendientes
            {pendingAbsences.length > 0 && (
              <span className="text-white text-xs font-bold rounded-full px-2 py-0.5"
                style={{ backgroundColor: 'var(--primary)', fontSize: '0.65rem' }}>
                {pendingAbsences.length}
              </span>
            )}
          </p>
          <button
            onClick={() => navigate('/admin/absences')}
            className="text-xs font-bold"
            style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver todas →
          </button>
        </div>

        {pendingAbsences.length === 0 ? (
          <div className="card text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay solicitudes pendientes en este momento
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAbsences.slice(0, 5).map((a) => (
              <div key={a.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {a.user?.nombre} {a.user?.apellidos}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--warning)', fontWeight: 500 }}>{a.tipo.replace(/_/g, ' ')}</span>
                    <span className="mx-2">·</span>
                    {a.fecha_inicio} → {a.fecha_fin}
                  </p>
                </div>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => navigate('/admin/absences')}
                >
                  Revisar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}