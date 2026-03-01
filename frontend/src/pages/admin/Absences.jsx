import { useState, useEffect } from 'react'
import { getAllAbsences, reviewAbsence } from '../../api/absences'
import { getAllUsers } from '../../api/users'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const TIPOS = {
  VACACIONES_ANUALES: 'Vacaciones anuales',
  BAJA_MEDICA: 'Baja médica (IT)',
  ACCIDENTE_LABORAL: 'Accidente laboral',
  MATERNIDAD: 'Maternidad',
  PATERNIDAD_NACIMIENTO: 'Paternidad',
  PERMISO_MATRIMONIO: 'Matrimonio',
  PERMISO_FALLECIMIENTO_FAMILIAR: 'Fallecimiento familiar',
  PERMISO_MUDANZA: 'Mudanza',
  ASUNTOS_PROPIOS: 'Asuntos propios',
  PERMISO_NO_RETRIBUIDO: 'Permiso no retribuido',
  OTROS: 'Otros',
}

function AbsenceCard({ absence, onReview }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-text-primary">
            {absence.user?.nombre} {absence.user?.apellidos}
          </p>
          <p className="text-xs text-primary font-medium mt-0.5">
            {TIPOS[absence.tipo] ?? absence.tipo}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {format(parseISO(absence.fecha_inicio), 'd MMM yyyy', { locale: es })}
            {' → '}
            {format(parseISO(absence.fecha_fin), 'd MMM yyyy', { locale: es })}
          </p>
          {absence.comentario_trabajador && (
            <p className="text-xs text-text-secondary mt-1.5 bg-surface-alt rounded-lg p-2 italic">
              {absence.comentario_trabajador}
            </p>
          )}
        </div>
        <Badge value={absence.estado} />
      </div>
      {absence.estado === 'pendiente' && (
        <div className="flex gap-2 pt-1">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-xl py-2 transition-colors"
            onClick={() => onReview(absence, 'aprobada')}
          >
            <CheckCircle className="w-4 h-4" />
            Aprobar
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-xl py-2 transition-colors"
            onClick={() => onReview(absence, 'denegada')}
          >
            <XCircle className="w-4 h-4" />
            Denegar
          </button>
        </div>
      )}
      {absence.comentario_rrhh && (
        <p className={`text-xs rounded-lg p-2 ${absence.estado === 'denegada' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <span className="font-semibold">RRHH/Admin: </span>{absence.comentario_rrhh}
        </p>
      )}
    </div>
  )
}

export default function AdminAbsences() {
  const [absences, setAbsences] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ user_id: '', estado: 'pendiente' })
  const [reviewing, setReviewing] = useState(null)
  const [comentario, setComentario] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    const params = {}
    if (filters.user_id) params.user_id = filters.user_id
    if (filters.estado) params.estado = filters.estado
    getAllAbsences(params)
      .then((res) => setAbsences(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getAllUsers().then((res) => setUsers(res.data))
    load()
  }, [])

  const openReview = (absence, action) => {
    setReviewing({ absence, action })
    setComentario('')
    setSubmitError('')
  }

  const handleReview = async (e) => {
    e.preventDefault()
    if (reviewing.action === 'denegada' && !comentario.trim()) {
      setSubmitError('El comentario es obligatorio al denegar.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await reviewAbsence(reviewing.absence.id, {
        estado: reviewing.action,
        comentario_rrhh: comentario || undefined,
      })
      setReviewing(null)
      load()
    } catch (err) {
      setSubmitError(err.response?.data?.message ?? 'Error al revisar la solicitud.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Gestión de ausencias</h1>
        <p className="text-text-muted text-sm mt-1">Aprueba o deniega las solicitudes de ausencia.</p>
      </div>

      <div className="card p-5 flex flex-wrap gap-3">
        <div className="flex-1 min-w-36">
          <label className="label">Trabajador</label>
          <select className="input" value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}>
            <option value="">Todos</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-36">
          <label className="label">Estado</label>
          <select className="input" value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="denegada">Denegadas</option>
          </select>
        </div>
        <div className="self-end">
          <button className="btn-primary" onClick={load}>Buscar</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : absences.length === 0 ? (
        <div className="text-center py-12 text-text-muted">No hay solicitudes para los filtros seleccionados</div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">{absences.length} solicitudes</p>
          {absences.map((a) => <AbsenceCard key={a.id} absence={a} onReview={openReview} />)}
        </div>
      )}

      {reviewing && (
        <Modal
          title={reviewing.action === 'aprobada' ? 'Aprobar solicitud' : 'Denegar solicitud'}
          onClose={() => setReviewing(null)}
        >
          <form onSubmit={handleReview} className="space-y-4">
            <div className={`rounded-xl p-3 text-sm ${reviewing.action === 'aprobada' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-semibold">{reviewing.absence.user?.nombre} {reviewing.absence.user?.apellidos}</p>
              <p className="text-xs mt-0.5">{TIPOS[reviewing.absence.tipo]} · {reviewing.absence.fecha_inicio} → {reviewing.absence.fecha_fin}</p>
            </div>
            <div>
              <label className="label">
                Comentario {reviewing.action === 'denegada' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                className="input h-24 resize-none"
                placeholder={reviewing.action === 'denegada' ? 'Motivo de la denegación (obligatorio)' : 'Comentario opcional...'}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setReviewing(null)}>Cancelar</button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-2 font-medium rounded-xl py-2.5 transition-colors text-white ${reviewing.action === 'aprobada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {submitting
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : reviewing.action === 'aprobada' ? 'Confirmar aprobación' : 'Confirmar denegación'
                }
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
