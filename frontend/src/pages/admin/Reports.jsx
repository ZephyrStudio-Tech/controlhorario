import { useState, useEffect, Fragment } from 'react'
import { getAllUsers } from '../../api/users'
import { generateReport, getAllSessions } from '../../api/sessions'
import { FileDown, FileText, AlertCircle, Download, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Badge from '../../components/UI/Badge'

export default function AdminReports() {
  // Estado para el formulario de descarga
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ user_id: '', start_date: '', end_date: '', format: 'csv' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Estado para la tabla del "Resumen de Hoy"
  const [todaySessions, setTodaySessions] = useState([])
  const [loadingToday, setLoadingToday] = useState(true)

  useEffect(() => { 
    // Cargar usuarios para el selector
    getAllUsers().then((res) => setUsers(res.data)) 

    // Cargar las sesiones del día de hoy
    const loadTodaySessions = async () => {
      setLoadingToday(true)
      try {
        const today = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
        const res = await getAllSessions({ start_date: today, end_date: today })
        setTodaySessions(res.data)
      } catch (err) {
        console.error("Error cargando sesiones de hoy:", err)
      } finally {
        setLoadingToday(false)
      }
    }
    
    loadTodaySessions()
  }, [])

  // Función para exportar (La misma de tu código)
  const handleExport = async (e) => {
    e.preventDefault()
    if (!form.start_date || !form.end_date) { setError('Las fechas de inicio y fin son obligatorias.'); return }
    setError(''); setLoading(true)
    try {
      const params = { start_date: form.start_date, end_date: form.end_date, format: form.format }
      if (form.user_id) params.user_id = form.user_id
      const res = await generateReport(params)
      const mime = form.format === 'csv' ? 'text/csv' : 'application/pdf'
      const ext  = form.format === 'csv' ? 'csv' : 'pdf'
      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }))
      const a = document.createElement('a')
      a.href = url; a.download = `informe_${form.start_date}_${form.end_date}.${ext}`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al generar el informe.')
    } finally { setLoading(false) }
  }

  // Función directa para descargar SOLO lo de hoy
  const handleDownloadToday = async () => {
    const today = new Date().toISOString().split('T')[0]
    try {
      const res = await generateReport({ start_date: today, end_date: today, format: 'csv' })
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url; a.download = `informe_hoy_${today}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error descargando lo de hoy", err)
      alert("Hubo un error al descargar el informe de hoy.")
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Informes y Exportaciones</h1>
        <p className="text-sm mt-1 text-text-muted">Genera informes de asistencia, horas trabajadas y consulta el resumen del día.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Formulario de Exportación Personalizada */}
        <div className="xl:col-span-1">
          <form onSubmit={handleExport} className="rounded-sm border border-stroke bg-white shadow-default p-6 sticky top-24">
            <h2 className="font-semibold text-black mb-5 text-base flex items-center gap-2">
              <FileDown className="w-5 h-5 text-primary" />
              Generar Informe Personalizado
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2.5 block text-black font-medium text-sm">Trabajador</label>
                <select className="input" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
                  <option value="">Todos los trabajadores</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2.5 block text-black font-medium text-sm">Desde <span className="text-danger">*</span></label>
                  <input type="date" className="input" value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-2.5 block text-black font-medium text-sm">Hasta <span className="text-danger">*</span></label>
                  <input type="date" className="input" value={form.end_date} min={form.start_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="mb-2.5 block text-black font-medium text-sm">Formato</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'csv', icon: FileText, label: 'CSV', desc: 'Excel' },
                    { value: 'pdf', icon: FileDown, label: 'PDF', desc: 'Imprimir' },
                  ].map(({ value, icon: Icon, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, format: value })}
                      className={`flex flex-col items-center justify-center p-3 rounded border-2 transition-colors ${
                        form.format === value 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-stroke bg-transparent text-body hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-6 h-6 mb-1" />
                      <span className="font-bold text-sm">{label}</span>
                      <span className="text-[10px]">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded px-3 py-2 text-xs text-danger font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
                {loading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Download className="w-5 h-5" /> Descargar Informe</>
                }
              </button>
            </div>
          </form>
        </div>


        {/* COLUMNA DERECHA: Tabla de Actividad de Hoy */}
        <div className="xl:col-span-2">
          <div className="rounded-sm border border-stroke bg-white shadow-default overflow-hidden">
            
            <div className="border-b border-stroke py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-black text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Actividad de Hoy
                </h3>
                <p className="text-xs text-body mt-0.5 capitalize">
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>
              
              <button 
                onClick={handleDownloadToday}
                className="inline-flex items-center justify-center gap-2 bg-stroke text-black hover:bg-primary hover:text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar CSV de Hoy
              </button>
            </div>

            <div className="max-w-full overflow-x-auto">
              {loadingToday ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : todaySessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-body">
                  <p>Aún no hay fichajes registrados en el día de hoy.</p>
                </div>
              ) : (
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-whiten text-left">
                      <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider min-w-[200px]">Trabajador</th>
                      <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider min-w-[100px]">Entrada</th>
                      <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider min-w-[100px]">Salida</th>
                      <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider min-w-[120px]">Estado</th>
                      <th className="py-4 px-6 font-medium text-black text-xs uppercase tracking-wider text-right min-w-[150px]">Pausas/Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaySessions.map((s, index) => (
                      <tr key={s.id} className={`${index !== todaySessions.length - 1 ? 'border-b border-stroke' : ''} hover:bg-gray-50`}>
                        
                        <td className="py-3 px-6">
                          <p className="font-bold text-black text-sm">{s.user?.nombre} {s.user?.apellidos}</p>
                          <p className="text-[10px] text-body uppercase tracking-wider">{s.user?.rol}</p>
                        </td>

                        <td className="py-3 px-6">
                          <p className="text-sm font-medium text-black">{format(new Date(s.fecha_entrada), 'HH:mm')}</p>
                        </td>

                        <td className="py-3 px-6">
                          <p className="text-sm font-medium text-black">
                            {s.fecha_salida ? format(new Date(s.fecha_salida), 'HH:mm') : '—'}
                          </p>
                        </td>

                        <td className="py-3 px-6">
                          <Badge value={s.estado} />
                        </td>

                        <td className="py-3 px-6 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-semibold text-black bg-gray-100 px-2 py-0.5 rounded border border-stroke">
                              {s.horas_netas ? `${s.horas_netas}h netas` : 'En curso'}
                            </span>
                            {s.pauses && s.pauses.length > 0 && (
                              <span className="text-[10px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                                {s.pauses.length} pausa(s)
                              </span>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}