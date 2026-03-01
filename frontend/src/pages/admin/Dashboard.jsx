import { useState, useEffect } from 'react'
import { getUsersStats } from '../../api/users'
import { getPendingAbsences } from '../../api/absences'
import { getRecentDocuments } from '../../api/documents'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users, Clock, Coffee, LogOut, UserX, FileText, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  )
}

function QuickLink({ label, description, path, navigate }) {
  return (
    <button
      className="card p-4 text-left w-full hover:border-primary/40 transition-colors"
      onClick={() => navigate(path)}
    >
      <p className="font-semibold text-sm text-text-primary">{label}</p>
      <p className="text-xs text-text-muted mt-0.5">{description}</p>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Panel de Administración</h1>
        <p className="text-text-muted text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Today stats */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Estado del día</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Clock} label="Trabajando ahora" value={stats?.activos_hoy ?? 0} color="bg-green-100 text-green-700" />
          <StatCard icon={Coffee} label="En pausa" value={stats?.en_pausa ?? 0} color="bg-amber-100 text-amber-700" />
          <StatCard icon={LogOut} label="Han salido" value={stats?.han_salido ?? 0} color="bg-blue-100 text-blue-700" />
          <StatCard icon={UserX} label="Sin fichar" value={stats?.sin_fichar ?? 0} color="bg-surface-alt text-text-muted" />
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Acceso rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickLink label="Usuarios" description="Gestionar trabajadores y roles" path="/admin/users" navigate={navigate} />
          <QuickLink label="Registros" description="Ver y editar jornadas" path="/admin/records" navigate={navigate} />
          <QuickLink label="Ausencias" description="Aprobar solicitudes" path="/admin/absences" navigate={navigate} />
          <QuickLink label="Informes" description="Exportar CSV y PDF" path="/admin/reports" navigate={navigate} />
        </div>
      </div>

      {/* Pending absences */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Ausencias pendientes
            {pendingAbsences.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">
                {pendingAbsences.length}
              </span>
            )}
          </h2>
          <button className="text-xs text-primary font-medium" onClick={() => navigate('/admin/absences')}>
            Ver todas
          </button>
        </div>
        {pendingAbsences.length === 0 ? (
          <div className="card p-5 text-center text-text-muted text-sm">No hay solicitudes pendientes</div>
        ) : (
          <div className="space-y-2">
            {pendingAbsences.slice(0, 5).map((a) => (
              <div key={a.id} className="card px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-text-primary truncate">
                    {a.user?.nombre} {a.user?.apellidos}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {a.tipo.replace(/_/g, ' ')} · {a.fecha_inicio} → {a.fecha_fin}
                  </p>
                </div>
                <button
                  className="text-xs text-primary font-medium flex-shrink-0"
                  onClick={() => navigate('/admin/absences')}
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
