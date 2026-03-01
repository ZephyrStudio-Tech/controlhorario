import { useState, useEffect } from 'react'
import { getMyAbsences, createAbsence } from '../../api/absences'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import { Plus, Calendar, MessageSquare, AlertCircle } from 'lucide-react'

const TIPOS = [
  { value: 'VACACIONES_ANUALES', label: 'Vacaciones anuales' },
  { value: 'BAJA_MEDICA', label: 'Baja médica (IT)' },
  { value: 'ACCIDENTE_LABORAL', label: 'Accidente laboral' },
  { value: 'MATERNIDAD', label: 'Maternidad' },
  { value: 'PATERNIDAD_NACIMIENTO', label: 'Paternidad / Nacimiento' },
  { value: 'PERMISO_MATRIMONIO', label: 'Permiso por matrimonio' },
  { value: 'PERMISO_FALLECIMIENTO_FAMILIAR', label: 'Fallecimiento familiar' },
  { value: 'PERMISO_MUDANZA', label: 'Permiso por mudanza' },
  { value: 'ASUNTOS_PROPIOS', label: 'Asuntos propios' },
  { value: 'PERMISO_NO_RETRIBUIDO', label: 'Permiso no retribuido' },
  { value: 'OTROS', label: 'Otros' },
]

function AbsenceCard({ absence }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm">
            {TIPOS.find((t) => t.value === absence.tipo)?.label || absence.tipo}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {format(new Date(absence.fecha_inicio + 'T00:00:00'), 'd MMM yyyy', { locale: es })}
            {' '}&rarr;{' '}
            {format(new Date(absence.fecha_fin + 'T00:00:00'), 'd MMM yyyy', { locale: es })}
          </p>
          {absence.comentario_trabajador && (
            <p className="text-xs text-text-secondary mt-2 italic">
              <MessageSquare className="w-3 h-3 inline mr-1" />
              {absence.comentario_trabajador}
            </p>
          )}
          {absence.comentario_rrhh && (
            <p className={`text-xs mt-1 font-medium ${absence.estado === 'denegada' ? 'text-red-600' : 'text-green-700'}`}>
              RRHH: {absence.comentario_rrhh}
            </p>
          )}
        </div>
        <Badge value={absence.estado} />
      </div>
    </div>
  )
}

export default function WorkerAbsences() {
  const [absences, setAbsences] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    tipo: 'VACACIONES_ANUALES',
    fecha_inicio: '',
    fecha_fin: '',
    comentario_trabajador: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    getMyAbsences()
      .then((res) => setAbsences(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createAbsence({
        tipo: form.tipo,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        comentario_trabajador: form.comentario_trabajador || undefined,
      })
      setShowModal(false)
      setForm({ tipo: 'VACACIONES_ANUALES', fecha_inicio: '', fecha_fin: '', comentario_trabajador: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.detail?.message || 'Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const groupedByStatus = {
    pendiente: absences.filter((a) => a.estado === 'pendiente'),
    aprobada: absences.filter((a) => a.estado === 'aprobada'),
    denegada: absences.filter((a) => a.estado === 'denegada'),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mis Ausencias</h1>
          <p className="text-text-muted text-sm mt-1">Gestiona tus solicitudes de ausencia.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Nueva solicitud
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : absences.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No tienes solicitudes de ausencia</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByStatus.pendiente.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Pendientes</h2>
              <div className="space-y-3">
                {groupedByStatus.pendiente.map((a) => <AbsenceCard key={a.id} absence={a} />)}
              </div>
            </section>
          )}
          {groupedByStatus.aprobada.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Aprobadas</h2>
              <div className="space-y-3">
                {groupedByStatus.aprobada.map((a) => <AbsenceCard key={a.id} absence={a} />)}
              </div>
            </section>
          )}
          {groupedByStatus.denegada.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Denegadas</h2>
              <div className="space-y-3">
                {groupedByStatus.denegada.map((a) => <AbsenceCard key={a.id} absence={a} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {showModal && (
        <Modal title="Nueva solicitud de ausencia" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Tipo de ausencia</label>
              <select
                className="input"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                required
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fecha inicio</label>
                <input
                  type="date"
                  className="input"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Fecha fin</label>
                <input
                  type="date"
                  className="input"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Comentario (opcional)</label>
              <textarea
                className="input h-20 resize-none"
                placeholder="Añade un comentario si lo deseas..."
                value={form.comentario_trabajador}
                onChange={(e) => setForm({ ...form, comentario_trabajador: e.target.value })}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Enviar solicitud'
                }
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
