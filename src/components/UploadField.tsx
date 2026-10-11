import { useRef, useState } from 'react'
import { FileImage, ImagePlus, RefreshCw, Upload, X } from 'lucide-react'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

interface UploadFieldProps {
  image: File | null
  onImageChange: (file: File | null) => void
  disabled?: boolean
}

export default function UploadField({ image, onImageChange, disabled = false }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  const setFile = (file?: File) => {
    if (!file) return
    setError('')
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Choose a PNG, JPEG, or WebP image.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('This image is larger than 10 MB. Choose a smaller file.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const nextUrl = URL.createObjectURL(file)
    setPreviewUrl(nextUrl)
    onImageChange(file)
  }

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setError('')
    onImageChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const openPicker = () => inputRef.current?.click()

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="section-heading">
        <span className="step-number">01</span>
        <div>
          <h2 id="upload-title">Add an image</h2>
          <p>Start with something you want to understand.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => setFile(event.currentTarget.files?.[0])}
        disabled={disabled}
        aria-label="Choose an image to explain"
      />

      {image && previewUrl ? (
        <div className="upload-preview">
          <img src={previewUrl} alt={`Preview of ${image.name}`} />
          <div className="preview-fade" />
          <div className="preview-meta">
            <div className="preview-file">
              <FileImage size={16} aria-hidden="true" />
              <span title={image.name}>{image.name}</span>
            </div>
            <div className="preview-actions">
              <button className="icon-button light-icon" type="button" onClick={openPicker} disabled={disabled} aria-label="Replace image" title="Replace image">
                <RefreshCw size={15} />
              </button>
              <button className="icon-button light-icon" type="button" onClick={removeFile} disabled={disabled} aria-label="Remove image" title="Remove image">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
          onClick={openPicker}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
          onDragLeave={(event) => { event.preventDefault(); setIsDragging(false) }}
          onDrop={(event) => { event.preventDefault(); setIsDragging(false); setFile(event.dataTransfer.files?.[0]) }}
          disabled={disabled}
          aria-label="Choose or drop an image"
        >
          <span className="drop-icon"><ImagePlus size={21} strokeWidth={1.7} /></span>
          <span className="drop-title">Drop an image here</span>
          <span className="drop-subtitle">or <span className="browse-link">browse files</span></span>
          <span className="file-types"><Upload size={12} /> PNG, JPEG, WebP <i /> Up to 10 MB</span>
        </button>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </section>
  )
}
