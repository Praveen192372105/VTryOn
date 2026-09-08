import { useRef, useState, useCallback, type ChangeEvent, type DragEvent } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Shirt01Icon, Upload01Icon, Delete02Icon, Loading03Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUploadCustomOutfit } from "../hooks/use-upload-custom-outfit"
import { OUTFIT_CATEGORIES, OUTFIT_CATEGORY_LABELS } from "../constants"
import type { Outfit, OutfitCategory } from "../types"

export interface GarmentUploadDropzoneProps {
  onSuccess: (outfit: Outfit) => void
  onCancel?: () => void
  className?: string
}

export function GarmentUploadDropzone({ onSuccess, onCancel, className }: GarmentUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [garmentName, setGarmentName] = useState("")
  const [category, setCategory] = useState<OutfitCategory>("upper_body")
  const [dragCounter, setDragCounter] = useState(0)
  const [dropError, setDropError] = useState<string | null>(null)

  const uploadMutation = useUploadCustomOutfit()

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setDropError("Please select a valid image file (JPEG, PNG, or WebP).")
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      setDropError("Image size must be under 12MB.")
      return
    }
    setDropError(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    if (!garmentName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim()
      setGarmentName(cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : "")
    }
  }

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => prev + 1)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => Math.max(0, prev - 1))
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(0)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [garmentName])

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setGarmentName("")
    setDropError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedFile) return
    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        name: garmentName.trim() || undefined,
        category,
      })
      onSuccess(result)
    } catch {
      // Error handled by mutation toast
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0])
          }
        }}
      />

      {!selectedFile ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary",
            dragCounter > 0
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-border hover:border-border-strong hover:bg-surface-subtle/60 bg-surface"
          )}
        >
          <div className="size-12 rounded-full bg-surface-subtle border border-border flex items-center justify-center mb-3">
            <HugeiconsIcon icon={Upload01Icon} className="size-6 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-medium text-foreground">
            Drop your garment photo here, or browse
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Upload any shirt, dress, jacket, or pants on a clean background (JPG, PNG, WebP up to 12MB).
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-4 gap-1.5 text-xs">
            <HugeiconsIcon icon={Shirt01Icon} className="size-3.5" />
            <span>Select garment file</span>
          </Button>
          {dropError && <p className="text-xs text-destructive font-medium mt-2">{dropError}</p>}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
          <div className="flex gap-4 items-start">
            {previewUrl && (
              <div className="relative size-24 shrink-0 rounded-xl overflow-hidden border border-border bg-surface-subtle">
                <img src={previewUrl} alt="Garment preview" className="size-full object-contain" />
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute top-1 right-1 size-6 rounded-full bg-surface/90 border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                </button>
              </div>
            )}
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Garment Name
                </label>
                <Input
                  value={garmentName}
                  onChange={(e) => setGarmentName(e.target.value)}
                  placeholder="e.g. Navy Floral Linen Shirt"
                  className="text-xs h-8"
                  disabled={uploadMutation.isPending}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Clothing Category
                </label>
                <div className="flex gap-1.5 overflow-x-auto">
                  {OUTFIT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      disabled={uploadMutation.isPending}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-colors cursor-pointer whitespace-nowrap",
                        category === cat
                          ? "bg-primary text-primary-foreground border-primary font-medium"
                          : "border-border text-muted-foreground hover:text-foreground bg-surface"
                      )}
                    >
                      {OUTFIT_CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={uploadMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleUploadSubmit}
              disabled={uploadMutation.isPending}
              className="text-xs gap-1.5"
            >
              {uploadMutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
                  <span>Uploading & Saving...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
                  <span>Upload & Select for Try-On</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
