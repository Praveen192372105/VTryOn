import { useRef, useState, useCallback, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import {
  ACCEPTED_IMAGE_TYPES_STRING,
  MAX_PERSON_UPLOAD_MB,
} from "../constants"

export interface PersonUploadDropzoneProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
  className?: string
}

export function PersonUploadDropzone({
  onFileSelected,
  disabled = false,
  className,
}: PersonUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragCounter, setDragCounter] = useState(0)
  const [dropError, setDropError] = useState<string | null>(null)
  const isDragOver = dragCounter > 0

  const triggerPicker = () => {
    if (disabled) return
    // Clear input value so selecting the same file triggers onChange
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    inputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDropError(null)
      onFileSelected(file)
    }
    // Reset file input value after selection
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      setDragCounter((prev) => prev + 1)
    },
    [disabled]
  )

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      setDragCounter((prev) => Math.max(0, prev - 1))
    },
    [disabled]
  )

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        e.dataTransfer.dropEffect = "copy"
      }
    },
    [disabled]
  )

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragCounter(0)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length === 0) return

      // Enforce single-file upload invariant
      if (files.length > 1) {
        setDropError("Please choose one image at a time.")
        return
      }

      setDropError(null)
      onFileSelected(files[0])
    },
    [disabled, onFileSelected]
  )

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      triggerPicker()
    }
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES_STRING}
        multiple={false}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={triggerPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        aria-label="Select or drop a portrait photo"
        aria-disabled={disabled}
        className={cn(
          "relative flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border transition-all select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isDragOver
            ? "border-primary bg-primary/5 shadow-xs"
            : "border-border/80 bg-surface hover:border-border-strong hover:bg-surface-subtle",
          disabled && "opacity-50 pointer-events-none cursor-not-allowed"
        )}
      >
        <div className="size-12 rounded-full bg-surface-subtle border border-border/80 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
          <HugeiconsIcon
            icon={Camera01Icon}
            className="size-6 text-foreground/80"
          />
        </div>

        <h3 className="text-sm font-medium text-foreground tracking-tight">
          Add a photo
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
          Choose a JPEG, PNG or WebP image up to {MAX_PERSON_UPLOAD_MB} MB.
        </p>
        <p className="text-[11px] text-muted-foreground/80 mt-2 font-mono">
          A clear portrait or full-body photo works best.
        </p>
      </div>

      {dropError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-2.5 rounded-lg bg-danger/10 text-danger border border-danger/20 text-xs"
        >
          <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0" />
          <span>{dropError}</span>
        </div>
      )}
    </div>
  )
}
