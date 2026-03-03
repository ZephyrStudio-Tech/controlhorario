import { useState, useEffect } from 'react'
import { getUserDocuments, getMyDocuments, downloadDocument } from '../../api/documents'
import { getSimpleUsers } from '../../api/users'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Download, Search } from 'lucide-react'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function HRDocuments() {
  const [docs, setDocs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [downloadError, setDownloadError] = useState(null)

  const load = (uid) => {
    setLoading(true)
    // Si hay usuario seleccionado usamos getUserDocuments, si no no cargamos nada
    // ya que no existe endpoint para listar todos los documentos con permiso RRHH
    if (uid) {
      getUserDocuments(uid)
        .then((res) => setDocs(res.data))
        .finally(() => setLoading(false))
    } else {
      setDocs([])
      setLoading(false)
    }
  }

  useEffect(() => {
    getSimpleUsers().then((res) => setUsers(res.data))
    setLoading(false)
  }, [])

  const handleSearch = () => load(userId)

  const handleDownload = async (doc) => {
    setDownloadError(null)
    try {
      const res = await downloadDocument(doc.id)
      const url = URL.createObjectURL(new Blob([res.data], { type: doc.tipo_mime }))
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nombre_original
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('No se pudo descargar el documento.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Documentos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Consulta los documentos subidos por los trabajadores.</p>
      </div>

      <div className="card p-5 flex gap-3">
        <div className="flex-1">
          <label className="label">Selecciona un trabajador</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">— Selecciona trabajador —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
          </select>
        </div>
        <div className="self-end">
          <button className="btn-primary flex items-center gap-2" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          {downloadError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : !userId ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Selecciona un trabajador para ver sus documentos</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Este trabajador no tiene documentos</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{docs.length} documentos</p>
          {docs.map((doc) => (
            <div key={doc.id} className="card px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(70,118,205,0.1)' }}>
                <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{doc.nombre_original}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {formatBytes(doc.tamaño_bytes)} · {format(new Date(doc.subido_en), 'd MMM yyyy', { locale: es })}
                </p>
              </div>
              <button className="btn-ghost p-2" onClick={() => handleDownload(doc)} aria-label="Descargar">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}