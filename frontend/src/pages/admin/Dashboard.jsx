import { useState, useEffect } from 'react'
import { getUsersStats } from '../../api/users'
import { getPendingAbsences } from '../../api/absences'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Coffee, LogOut, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-text-primary leading-none mb-1.5">{value}</p>
        <p className="text-xs font-medium text-text-secondary">{label}</p>
      </div>
    </div>
  )
}

function QuickLink({ label, description, path, navigate }) {
  return (
    <button
      className="card text-left w-full group"
      onClick={() => navigate(path)}
    >
      <p className="font-bold text-sm text-text-primary mb-1.5 group-hover:text-primary transition-colors">{label}</p>
      <p className="text-xs text-text-muted leading-relaxed">{description}</p>
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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Panel de Administración</h1>
        <p className="text-text-muted text-sm mt-1.5 capitalize-first">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Today stats */}
      <section>
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Estado del día</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Trabajando ahora" value={stats?.activos_hoy ?? 0} color="bg-emerald-100 text-emerald-700" />
          <StatCard icon={Coffee} label="En pausa" value={stats?.en_pausa ?? 0} color="bg-amber-100 text-amber-700" />
          <StatCard icon={LogOut} label="Han salido" value={stats?.han_salido ?? 0} color="bg-blue-100 text-blue-700" />
          <StatCard icon={UserX} label="Sin fichar" value={stats?.sin_fichar ?? 0} color="bg-slate-100 text-slate-500" />
        </div>
      </section>

      {/* Accesos rápidos */}
      <section>
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Acceso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink label="Usuarios" description="Gestionar trabajadores y roles" path="/admin/users" navigate={navigate} />
          <QuickLink label="Registros" description="Ver y editar jornadas" path="/admin/records" navigate={navigate} />
          <QuickLink label="Ausencias" description="Aprobar solicitudes" path="/admin/absences" navigate={navigate} />
          <QuickLink label="Informes" description="Exportar CSV y PDF" path="/admin/reports" navigate={navigate} />
        </div>
      </section>

      {/* Pending absences */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            Ausencias pendientes
            {pendingAbsences.length > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                {pendingAbsences.length}
              </span>
            )}
          </h2>
          <button 
            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors" 
            onClick={() => navigate('/admin/absences')}
          >
            Ver todas &rarr;
          </button>
        </div>
        
        {pendingAbsences.length === 0 ? (
          <div className="card p-8 text-center text-text-muted text-sm border-dashed border-2 bg-transparent shadow-none">
            No hay solicitudes pendientes en este momento
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAbsences.slice(0, 5).map((a) => (
              <div key={a.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-text-primary truncate">
                    {a.user?.nombre} {a.user?.apellidos}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    <span className="font-medium text-amber-600">{a.tipo.replace(/_/g, ' ')}</span> 
                    <span className="mx-2">•</span> 
                    {a.fecha_inicio} &rarr; {a.fecha_fin}
                  </p>
                </div>
                <button
                  className="btn-secondary text-xs px-4 py-2 w-full sm:w-auto"
                  onClick={() => navigate('/admin/absences')}
                >
                  Revisar solicitud
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}