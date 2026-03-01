import { useState, useEffect } from 'react'
import { getUsersStats } from '../../api/users'
import { getPendingAbsences } from '../../api/absences'
import { getRecentDocuments } from '../../api/documents'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users, Clock, Coffee, LogOut, UserX, FileText, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-6 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-text-primary leading-none mb-1.5">{value}</p>
        <p className="text-sm text-text-muted">{label}</p>
      </div>
    </div>
  )
}

export default function HRDashboard() {
  const [stats, setStats] = useState(null)
  const [pendingAbsences, setPendingAbsences] = useState([])
  const [recentDocs, setRecentDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getUsersStats(),
      getPendingAbsences(),
      getRecentDocuments(),
    ]).then(([statsRes, absRes, docsRes]) => {
      setStats(statsRes.data)
      setPendingAbsences(absRes.data)
      setRecentDocs(docsRes.data)
    }).finally(() => setLoading(false))
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
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Panel de RRHH</h1>
        <p className="text-text-muted text-sm mt-1.5">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Today stats */}
      <div>
        <h2 className="section-heading">Hoy</h2>
        <div className="grid grid-cols-2 gap-5">
          <StatCard
            icon={Clock}
            label="Trabajando ahora"
            value={stats?.activos_hoy ?? 0}
            color="bg-green-100 text-green-700"
          />
          <StatCard
            icon={Coffee}
            label="En pausa"
            value={stats?.en_pausa ?? 0}
            color="bg-amber-100 text-amber-700"
          />
          <StatCard
            icon={LogOut}
            label="Han salido"
            value={stats?.han_salido ?? 0}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            icon={UserX}
            label="Sin fichar"
            value={stats?.sin_fichar ?? 0}
            color="bg-slate-100 text-slate-500"
          />
        </div>
      </div>

      {/* Pending absences */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-heading mb-0">
            Ausencias pendientes
            {pendingAbsences.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">
                {pendingAbsences.length}
              </span>
            )}
          </h2>
          <button
            className="text-xs text-primary font-medium hover:text-primary-dark transition-colors"
            onClick={() => navigate('/hr/absences')}
          >
            Ver todas
          </button>
        </div>
        {pendingAbsences.length === 0 ? (
          <div className="card p-6 text-center text-text-muted text-sm">
            No hay solicitudes pendientes
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingAbsences.slice(0, 5).map((a) => (
              <div key={a.id} className="card px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-text-primary truncate">
                    {a.user?.nombre} {a.user?.apellidos}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {a.tipo.replace(/_/g, ' ')} · {format(new Date(a.fecha_inicio + 'T00:00:00'), 'd MMM', { locale: es })}
                    {' → '}{format(new Date(a.fecha_fin + 'T00:00:00'), 'd MMM yyyy', { locale: es })}
                  </p>
                </div>
                <button
                  className="text-xs text-primary font-medium flex-shrink-0 hover:text-primary-dark transition-colors"
                  onClick={() => navigate('/hr/absences')}
                >
                  Revisar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-heading mb-0">Documentos recientes</h2>
          <button className="text-xs text-primary font-medium hover:text-primary-dark transition-colors" onClick={() => navigate('/hr/documents')}>
            Ver todos
          </button>
        </div>
        {recentDocs.length === 0 ? (
          <div className="card p-6 text-center text-text-muted text-sm">No hay documentos recientes</div>
        ) : (
          <div className="space-y-2.5">
            {recentDocs.slice(0, 4).map((d) => (
              <div key={d.id} className="card px-5 py-4 flex items-center gap-3">
                <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{d.nombre_original}</p>
                  <p className="text-xs text-text-muted">
                    {d.user?.nombre} {d.user?.apellidos}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
