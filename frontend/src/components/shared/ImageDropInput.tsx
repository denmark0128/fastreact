import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface ImageDropInputProps {
  label: string
  value: string
  placeholder?: string
  disabled?: boolean
  allowRemove?: boolean
  removeLabel?: string
  onChange: (value: string) => void
}

function ImageDropInput({
  label,
  value,
  placeholder,
  disabled = false,
  allowRemove = false,
  removeLabel = 'Remove Image',
  onChange,
}: ImageDropInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.')
      return
    }

    const maxFileSizeInBytes = 2 * 1024 * 1024
    if (file.size > maxFileSizeInBytes) {
      setError('Image must be 2MB or smaller.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        onChange(result)
        setError(null)
      }
    }
    reader.readAsDataURL(file)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (disabled) {
      return
    }
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      readImageFile(file)
    }
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      readImageFile(file)
    }
    event.target.value = ''
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</label>

      <div
        className={`min-h-28 rounded-lg border border-dashed p-5 text-sm text-slate-700 dark:text-slate-300 ${isDragging ? 'border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-800' : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'} ${disabled ? 'opacity-60' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) {
            setIsDragging(true)
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex h-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>Drag and drop image here, or upload from your device.</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
              Upload Image
            </Button>
            {allowRemove && value ? (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => {
                  onChange('')
                  if (error) {
                    setError(null)
                  }
                }}
              >
                {removeLabel}
              </Button>
            ) : null}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={onFileChange}
        />
      </div>

      <Input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value)
          if (error) {
            setError(null)
          }
        }}
      />

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

export default ImageDropInput
