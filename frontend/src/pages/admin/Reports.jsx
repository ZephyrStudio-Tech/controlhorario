import { useState } from 'react'
import { getAllUsers } from '../../api/users'
import { useEffect } from 'react'
import { generateReport } from '../../api/sessions'
import { FileDown, FileText, AlertCircle } from 'lucide-react'

export default function AdminReports() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    user_id: '',
    start_date: '',
    end_date: '',
    format: 'csv',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllUsers().then((res) => setUsers(res.data))
  }, [])

  const handleExport = async (e) => {
    e.preventDefault()
    if (!form.start_date || !form.end_date) {
      setError('Las fechas de inicio y fin son obligatorias.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const params = {
        start_date: form.start_date,
        end_date: form.end_date,
        format: form.format,
      }
      if (form.user_id) params.user_id = form.user_id

      const res = await generateReport(params)
      const mime = form.format === 'csv' ? 'text/csv' : 'application/pdf'
      const ext = form.format === 'csv' ? 'csv' : 'pdf'
      const filename = `informe_${form.start_date}_${form.end_date}.${ext}`
      const url = URL.createObjectURL(new Blob([res.data], { type: mime }))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al generar el informe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Informes y exportaciones</h1>
        <p className="text-text-muted text-sm mt-1">
          Genera informes de asistencia y horas trabajadas en CSV o PDF.
        </p>
      </div>

      <form onSubmit={handleExport} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-text-primary text-sm">Parámetros del informe</h2>

          <div>
            <label className="label">Trabajador</label>
            <select
              className="input"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            >
              <option value="">Todos los trabajadores</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha inicio <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="input"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Fecha fin <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="input"
                value={form.end_date}
                min={form.start_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Formato de exportación</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, format: 'csv' })}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${
                  form.format === 'csv'
                    ? 'border-primary bg-primary/5'
                    : 'border-surface-border hover:border-primary/40'
                }`}
              >
                <FileText className={`w-6 h-6 flex-shrink-0 ${form.format === 'csv' ? 'text-primary' : 'text-text-muted'}`} />
                <div>
                  <p className={`font-semibold text-sm ${form.format === 'csv' ? 'text-primary' : 'text-text-primary'}`}>CSV</p>
                  <p className="text-xs text-text-muted">Para Excel / hojas de cálculo</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, format: 'pdf' })}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${
                  form.format === 'pdf'
                    ? 'border-primary bg-primary/5'
                    : 'border-surface-border hover:border-primary/40'
                }`}
              >
                <FileDown className={`w-6 h-6 flex-shrink-0 ${form.format === 'pdf' ? 'text-primary' : 'text-text-muted'}`} />
                <div>
                  <p className={`font-semibold text-sm ${form.format === 'pdf' ? 'text-primary' : 'text-text-primary'}`}>PDF</p>
                  <p className="text-xs text-text-muted">Informe listo para imprimir</p>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary w-full flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              Generar y descargar informe
            </>
          )}
        </button>
      </form>
    </div>
  )
}
