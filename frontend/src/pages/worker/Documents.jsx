import { useState, useEffect } from 'react'
import { getMyDocuments, uploadDocument, downloadDocument } from '../../api/documents'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import FileUpload from '../../components/UI/FileUpload'
import Modal from '../../components/UI/Modal'
import { FileText, Download, Plus, AlertCircle } from 'lucide-react'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function mimeIcon(mime) {
  if (mime === 'application/pdf') return '📄'
  return '🖼'
}

export default function WorkerDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    getMyDocuments()
      .then((res) => setDocuments(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await uploadDocument(fd)
      setShowModal(false)
      setFile(null)
      load()
    } catch (err) {
      setError(err.response?.data?.detail?.message || 'Error al subir el fichero')
    } finally {
      setUploading(false)
    }
  }

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Mis Documentos</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Subir fichero
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No has subido ningún documento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="card p-4 flex items-center gap-4">
              <div className="text-2xl flex-shrink-0">{mimeIcon(doc.tipo_mime)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary text-sm truncate">{doc.nombre_original}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatBytes(doc.tamaño_bytes)} &bull;{' '}
                  {format(new Date(doc.subido_en), 'd MMM yyyy, HH:mm', { locale: es })}
                </p>
              </div>
              <button
                className="btn-secondary p-2"
                onClick={() => handleDownload(doc)}
                aria-label="Descargar"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Subir documento" onClose={() => { setShowModal(false); setFile(null); setError(null) }}>
          <div className="space-y-4">
            <FileUpload onFileSelect={setFile} />
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                className="btn-secondary flex-1"
                onClick={() => { setShowModal(false); setFile(null); setError(null) }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary flex-1"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Subir'
                }
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
