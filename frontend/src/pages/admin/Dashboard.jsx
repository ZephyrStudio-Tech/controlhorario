import { useState, useEffect } from 'react'
import { getUsersStats } from '../../api/users'
import { getPendingAbsences } from '../../api/absences'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Coffee, LogOut, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="card p-6 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-title-md font-bold text-text-primary text-2xl mb-0.5">{value}</h4>
        <span className="text-sm font-medium text-text-muted">{label}</span>
      </div>
    </div>
  )
}

function QuickLink({ label, description, path, navigate }) {
  return (
    <button
      onClick={() => navigate(path)}
      className="card group"
    >
      <h4 className="font-bold text-base text-text-primary mb-1 group-hover:text-primary transition-colors">
        {label}
      </h4>
      <p className="text-sm text-text-muted leading-relaxed">
        {description}
      </p>
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabecera del Dashboard */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Panel de Administración
        </h1>
        <p className="text-sm mt-1 text-text-muted capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats - Ahora responsivo */}
      <section>
        <h2 className="section-heading">Estado del día</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard icon={Clock}  label="Trabajando ahora" value={stats?.activos_hoy ?? 0} colorClass="bg-success-light text-success-fg" />
          <StatCard icon={Coffee} label="En pausa"         value={stats?.en_pausa ?? 0}     colorClass="bg-warning-light text-warning-fg" />
          <StatCard icon={LogOut} label="Han salido"       value={stats?.han_salido ?? 0}   colorClass="bg-primary/10 text-primary" />
          <StatCard icon={UserX}  label="Sin fichar"       value={stats?.sin_fichar ?? 0}   colorClass="bg-surface border border-surface-border text-text-secondary" />
        </div>
      </section>

      {/* Acceso rápido - Ahora responsivo */}
      <section>
        <h2 className="section-heading">Acceso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <QuickLink label="Usuarios"  description="Gestionar trabajadores y roles" path="/admin/users"    navigate={navigate} />
          <QuickLink label="Registros" description="Ver y editar jornadas"          path="/admin/records"  navigate={navigate} />
          <QuickLink label="Ausencias" description="Aprobar solicitudes"            path="/admin/absences" navigate={navigate} />
          <QuickLink label="Informes"  description="Exportar CSV y PDF"             path="/admin/reports"  navigate={navigate} />
        </div>
      </section>

      {/* Ausencias pendientes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-heading mb-0 flex items-center gap-2">
            Ausencias pendientes
            {pendingAbsences.length > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingAbsences.length}
              </span>
            )}
          </h2>
          <button
            onClick={() => navigate('/admin/absences')}
            className="text-sm font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
          >
            Ver todas &rarr;
          </button>
        </div>

        {pendingAbsences.length === 0 ? (
          <div className="card p-8 text-center text-sm text-text-muted border-dashed border-2 bg-transparent shadow-none">
            No hay solicitudes pendientes en este momento
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAbsences.slice(0, 5).map((a) => (
              <div key={a.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base truncate text-text-primary">
                    {a.user?.nombre} {a.user?.apellidos}
                  </p>
                  <p className="text-sm text-text-muted mt-1 flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-warning">{a.tipo.replace(/_/g, ' ')}</span>
                    <span className="hidden sm:inline">&bull;</span>
                    <span>{a.fecha_inicio} &rarr; {a.fecha_fin}</span>
                  </p>
                </div>
                <button
                  className="btn-secondary btn-sm whitespace-nowrap w-full sm:w-auto"
                  onClick={() => navigate('/admin/absences')}
                >
                  Revisar Solicitud
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}