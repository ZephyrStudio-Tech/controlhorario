import { useState } from 'react'
import { getAllUsers } from '../../api/users'
import { useEffect } from 'react'
import { generateReport } from '../../api/sessions'
import { FileDown, FileText, AlertCircle } from 'lucide-react'

export default function AdminReports() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ user_id: '', start_date: '', end_date: '', format: 'csv' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getAllUsers().then((res) => setUsers(res.data)) }, [])

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Informes y exportaciones</h1>
        <p className="text-sm mt-1 text-text-muted">Genera informes de asistencia y horas trabajadas en CSV o PDF.</p>
      </div>

      <form onSubmit={handleExport}>
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-sm text-text-primary">Parámetros del informe</h2>

          <div>
            <label className="label">Trabajador</label>
            <select className="input" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
              <option value="">Todos los trabajadores</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha inicio <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="date" className="input" value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Fecha fin <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="date" className="input" value={form.end_date} min={form.start_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="label">Formato de exportación</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { value: 'csv', icon: FileText, label: 'CSV',  desc: 'Para Excel / hojas de cálculo' },
                { value: 'pdf', icon: FileDown, label: 'PDF',  desc: 'Informe listo para imprimir' },
              ].map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, format: value })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem', borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${form.format === value ? 'var(--primary)' : 'var(--surface-border)'}`,
                    background: form.format === value ? 'rgba(70,118,205,0.05)' : 'var(--surface-card)',
                    cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
                  }}
                >
                  <Icon className="w-6 h-6 flex-shrink-0"
                    style={{ color: form.format === value ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <div>
                    <p className="font-semibold text-sm"
                      style={{ color: form.format === value ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {label}
                    </p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary btn-lg w-full" disabled={loading}>
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><FileDown className="w-4 h-4" /> Generar y descargar informe</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}