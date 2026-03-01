import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/jpg']
const MAX_MB = 30

export default function FileUpload({ onFileSelect }) {
  const inputRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = (file) => {
    if (!file) return
    if (!ALLOWED.includes(file.type)) {
      setError('Solo se permiten ficheros PDF, JPG y JPEG')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El fichero supera el límite de ${MAX_MB}MB`)
      return
    }
    setError(null)
    setSelected(file)
    onFileSelect(file)
  }

  return (
    <div>
      <div
        className="border-2 border-dashed border-surface-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files[0])
        }}
      >
        {selected ? (
          <div className="flex items-center justify-center gap-2 text-sm text-text-primary">
            <span>{selected.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelected(null)
                onFileSelect(null)
              }}
              className="text-text-muted hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">
              Arrastra un fichero o <span className="text-primary font-medium">haz clic</span>
            </p>
            <p className="text-xs text-text-muted mt-1">PDF, JPG, JPEG — máx. {MAX_MB}MB</p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}
