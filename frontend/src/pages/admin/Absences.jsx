import { useState, useEffect } from 'react'
import { getAllAbsences, reviewAbsence } from '../../api/absences'
import { getAllUsers } from '../../api/users'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import { CheckCircle, XCircle, AlertCircle, Search, MessageSquare } from 'lucide-react'

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

export default function AdminAbsences() {
  const [absences, setAbsences] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ user_id: '', estado: 'pendiente' })
  
  // Estados para el Modal de revisión
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
      setSubmitError('El comentario es obligatorio al denegar una solicitud.')
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
    <div className="flex flex-col gap-8">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Gestión de Ausencias</h1>
        <p className="text-sm mt-1 text-text-muted">Revisa, aprueba o deniega las solicitudes de permisos y vacaciones.</p>
      </div>

      {/* Tarjeta de Filtros (Estilo TailAdmin) */}
      <div className="rounded-sm border border-stroke bg-white shadow-default p-6">
        <h3 className="font-semibold text-black mb-4 text-sm uppercase tracking-wider">Filtros de Búsqueda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          
          <div>
            <label className="mb-2.5 block text-black font-medium text-sm">Trabajador</label>
            <select className="input" value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}>
              <option value="">Todos los trabajadores</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
            </select>
          </div>
          
          <div>
            <label className="mb-2.5 block text-black font-medium text-sm">Estado</label>
            <select className="input" value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes de Revisión</option>
              <option value="aprobada">Aprobadas</option>
              <option value="denegada">Denegadas</option>
            </select>
          </div>

          <div>
            <button className="btn-primary w-full py-3" onClick={load}>
              <Search className="w-5 h-5" />
              Filtrar Solicitudes
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Datos (Estilo TailAdmin) */}
      <div className="rounded-sm border border-stroke bg-white shadow-default overflow-hidden">
        
        <div className="border-b border-stroke py-4 px-6 flex justify-between items-center">
          <h3 className="font-semibold text-black text-lg">
            Listado de Solicitudes <span className="text-sm font-normal text-body ml-2">({absences.length})</span>
          </h3>
        </div>

        <div className="max-w-full overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : absences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-body">
              <p>No hay solicitudes que coincidan con los filtros.</p>
            </div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-whiten text-left">
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[200px]">Trabajador</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[180px]">Motivo</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[180px]">Fechas</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[150px]">Comentarios</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider min-w-[120px]">Estado</th>
                  <th className="py-4 px-6 font-medium text-black text-sm uppercase tracking-wider text-right min-w-[200px]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {absences.map((a, index) => (
                  <tr key={a.id} className={`${index !== absences.length - 1 ? 'border-b border-stroke' : ''} hover:bg-gray-50 transition-colors`}>
                    
                    {/* Trabajador */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <p className="font-bold text-black text-sm">{a.user?.nombre} {a.user?.apellidos}</p>
                      </div>
                    </td>

                    {/* Motivo */}
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-black">{TIPOS[a.tipo] ?? a.tipo}</p>
                    </td>

                    {/* Fechas */}
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-black">
                        {format(parseISO(a.fecha_inicio), 'd MMM yyyy', { locale: es })}
                        <span className="mx-2 text-body">&rarr;</span>
                        {format(parseISO(a.fecha_fin), 'd MMM yyyy', { locale: es })}
                      </p>
                    </td>

                    {/* Comentarios */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2">
                        {a.comentario_trabajador ? (
                          <div className="flex items-start gap-1 text-xs text-body italic" title="Comentario del trabajador">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>"{a.comentario_trabajador}"</span>
                          </div>
                        ) : (
                          <span className="text-xs text-body italic">— Sin observaciones —</span>
                        )}
                        
                        {a.comentario_rrhh && (
                          <div className={`text-xs rounded p-2 border ${a.estado === 'denegada' ? 'bg-danger/5 border-danger/20 text-danger' : 'bg-success/5 border-success/20 text-success-fg'}`}>
                            <span className="font-bold">Resolución: </span>{a.comentario_rrhh}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-6">
                      <Badge value={a.estado} />
                    </td>

                    {/* Acciones */}
                    <td className="py-4 px-6 text-right">
                      {a.estado === 'pendiente' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openReview(a, 'aprobada')}
                            className="inline-flex items-center justify-center gap-1.5 bg-success/10 text-success-fg hover:bg-success hover:text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-success/20"
                          >
                            <CheckCircle className="w-4 h-4" /> Aprobar
                          </button>
                          <button
                            onClick={() => openReview(a, 'denegada')}
                            className="inline-flex items-center justify-center gap-1.5 bg-danger/10 text-danger hover:bg-danger hover:text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-danger/20"
                          >
                            <XCircle className="w-4 h-4" /> Denegar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-body italic">Revisada</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Revisión */}
      {reviewing && (
        <Modal
          title={reviewing.action === 'aprobada' ? 'Confirmar Aprobación' : 'Denegar Solicitud'}
          onClose={() => setReviewing(null)}
        >
          <form onSubmit={handleReview} className="space-y-4">
            
            <div className={`border rounded-sm px-4 py-3 text-sm ${reviewing.action === 'aprobada' ? 'bg-success/10 border-success/20 text-success-fg' : 'bg-danger/10 border-danger/20 text-danger'}`}>
              Estás a punto de <span className="font-bold uppercase">{reviewing.action === 'aprobada' ? 'aprobar' : 'denegar'}</span> la solicitud de <b>{reviewing.absence.user?.nombre} {reviewing.absence.user?.apellidos}</b>.
            </div>

            <div>
              <label className="label text-black">
                Comentario de resolución {reviewing.action === 'denegada' && <span className="text-danger">*</span>}
              </label>
              <textarea
                className="input min-h-[100px]"
                placeholder={reviewing.action === 'denegada' ? 'Por favor, indica el motivo de la denegación (Obligatorio)' : 'Puedes dejar un mensaje al trabajador (Opcional)'}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
            
            {submitError && (
              <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-sm px-4 py-3 text-sm text-danger">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-stroke mt-6">
              <button type="button" className="btn-secondary w-full" onClick={() => setReviewing(null)}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`btn w-full text-white font-bold ${reviewing.action === 'aprobada' ? 'bg-success hover:bg-opacity-90' : 'bg-danger hover:bg-opacity-90'}`}
              >
                {submitting ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}