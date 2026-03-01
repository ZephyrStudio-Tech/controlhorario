import { useState, useEffect } from 'react'
import { getAllDocuments, downloadDocument } from '../../api/documents'
import { getAllUsers } from '../../api/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Download, Search } from 'lucide-react'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminDocuments() {
  const [docs, setDocs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  const load = () => {
    setLoading(true)
    const params = {}
    if (userId) params.user_id = userId
    getAllDocuments(params)
      .then((res) => setDocs(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getAllUsers().then((res) => setUsers(res.data))
    load()
  }, [])

  const handleDownload = async (doc) => {
    try {
      const res = await downloadDocument(doc.id)
      const url = URL.createObjectURL(new Blob([res.data], { type: doc.tipo_mime }))
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nombre_original
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Documentos</h1>
        <p className="text-text-muted text-sm mt-1">Consulta los documentos subidos por los trabajadores.</p>
      </div>

      <div className="card p-5 flex gap-3">
        <div className="flex-1">
          <label className="label">Filtrar por trabajador</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Todos los trabajadores</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>
            ))}
          </select>
        </div>
        <div className="self-end">
          <button className="btn-primary flex items-center gap-2" onClick={load}>
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay documentos</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">{docs.length} documentos</p>
          {docs.map((doc) => (
            <div key={doc.id} className="card px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-text-primary truncate">{doc.nombre_original}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {doc.user?.nombre} {doc.user?.apellidos}
                  {' · '}{formatBytes(doc.tamaño_bytes)}
                  {' · '}{format(new Date(doc.subido_en), 'd MMM yyyy', { locale: es })}
                </p>
              </div>
              <button
                className="btn-ghost p-2"
                onClick={() => handleDownload(doc)}
                aria-label="Descargar"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
