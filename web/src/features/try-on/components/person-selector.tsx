import { useState } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Camera01Icon,
  PlusSignIcon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { usePersonUploads, useCreatePersonUpload } from "../../uploads"
import { AuthenticatedImage } from "../../../components/image"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog"
import { PersonUploadDropzone } from "../../uploads/components/person-upload-dropzone"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"

export interface PersonSelectorProps {
  selectedId: string | null
  onSelect: (uploadId: string) => void
  onUploadClick?: () => void
  className?: string
}

export function PersonSelector({
  selectedId,
  onSelect,
  onUploadClick,
  className,
}: PersonSelectorProps) {
  const prefersReduced = useReducedMotion()
  const { uploads, isLoading } = usePersonUploads()
  const createUploadMutation = useCreatePersonUpload()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerTab, setPickerTab] = useState<"library" | "upload">("library")

  const selectedUpload = selectedId
    ? uploads.find((u) => u.id === selectedId) || null
    : null

  const selectedMediaUrl = selectedUpload
    ? selectedUpload.image_url || selectedUpload.public_url || selectedUpload.storage_path
    : null

  const handleOpenPicker = () => {
    if (onUploadClick) {
      onUploadClick()
      return
    }
    setPickerTab(uploads.length === 0 ? "upload" : "library")
    setIsPickerOpen(true)
  }

  const handleSelectUpload = (uploadId: string) => {
    onSelect(uploadId)
    setIsPickerOpen(false)
  }

  const handleFileDrop = async (file: File) => {
    try {
      const result = await createUploadMutation.mutateAsync(file)
      onSelect(result.id)
      setIsPickerOpen(false)
    } catch {
      // Error handled by mutation hook
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
          01 — Your photo
        </span>
        {selectedUpload && (
          <button
            type="button"
            onClick={handleOpenPicker}
            className="text-xs text-foreground hover:underline font-medium cursor-pointer"
          >
            Change photo
          </button>
        )}
      </div>

      {/* Surface display */}
      {isLoading ? (
        <div className="w-full aspect-[3/4] max-h-[460px] rounded-2xl bg-surface-subtle animate-pulse border border-border flex items-center justify-center">
          <HugeiconsIcon icon={Loading03Icon} className="size-6 text-muted-foreground animate-spin" />
        </div>
      ) : selectedUpload && selectedMediaUrl ? (
        /* Selected State */
        <div className="relative group rounded-2xl border border-border bg-surface overflow-hidden shadow-2xs">
          <div className="w-full aspect-[3/4] max-h-[460px] flex items-center justify-center bg-surface-subtle overflow-hidden">
            <AuthenticatedImage
              src={selectedMediaUrl}
              alt={selectedUpload.original_filename ? `Your selected photo: ${selectedUpload.original_filename}` : "Your selected person photo"}
              aspectRatio="3/4"
              objectFit="contain"
              containerClassName="size-full"
              className="size-full"
            />
          </div>

          {/* Selected indicator overlay badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-xs border border-border text-[11px] font-medium text-foreground shadow-2xs">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5 text-primary" />
            <span>Your photo</span>
          </div>

          {/* Bottom quick actions */}
          <div className="p-3 bg-surface border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
              {selectedUpload.original_filename || "Portrait photo"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenPicker}
              className="text-xs h-7 px-2.5 cursor-pointer"
            >
              Change photo
            </Button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpenPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleOpenPicker()
            }
          }}
          aria-label="Add a portrait photo to start try-on"
          className="w-full aspect-[3/4] max-h-[460px] border border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-border-strong hover:bg-surface-subtle/50 transition-colors cursor-pointer group bg-surface outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs"
        >
          <div className="size-12 rounded-full bg-surface-subtle border border-border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <HugeiconsIcon
              icon={Camera01Icon}
              className="size-6 text-muted-foreground group-hover:text-foreground transition-colors"
            />
          </div>
          <h3 className="text-sm font-medium text-foreground tracking-tight">
            No photo selected
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Add a clear portrait or full-body photo to start.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenPicker()
            }}
            className="mt-4 gap-1.5 text-xs cursor-pointer"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            <span>Add photo</span>
          </Button>
        </div>
      )}

      {/* Selection Dialog Modal */}
      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6 rounded-2xl bg-surface border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Select Your Photo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose an existing photo from your library or upload a new one.
            </DialogDescription>
          </DialogHeader>

          {/* Tab Selector */}
          <div className="flex gap-2 border-b border-border pb-3 pt-1">
            <button
              type="button"
              onClick={() => setPickerTab("library")}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                pickerTab === "library"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Photo Library ({uploads.length})
            </button>
            <button
              type="button"
              onClick={() => setPickerTab("upload")}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                pickerTab === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Upload New
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto py-3 min-h-[260px]">
            {pickerTab === "library" ? (
              uploads.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-xs text-muted-foreground">No photos found in your library.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerTab("upload")}
                    className="text-xs"
                  >
                    Upload your first photo
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {uploads.map((upload) => {
                    const isSelected = selectedId === upload.id
                    const mediaUrl = upload.image_url || upload.public_url || upload.storage_path
                    return (
                      <div
                        key={upload.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`Select photo ${upload.original_filename || "portrait"}`}
                        onClick={() => handleSelectUpload(upload.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleSelectUpload(upload.id)
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl transition-all relative overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-primary border border-border",
                          isSelected ? "border-primary shadow-xs" : "hover:opacity-90"
                        )}
                      >
                        <AuthenticatedImage
                          src={mediaUrl}
                          alt={upload.original_filename || "Uploaded portrait"}
                          aspectRatio="3/4"
                          objectFit="cover"
                          selected={isSelected}
                          className="rounded-xl overflow-hidden"
                        />
                        {isSelected && (
                          <motion.div
                            layoutId="person-picker-selection-ring"
                            className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none z-10"
                            transition={
                              prefersReduced
                                ? { duration: 0 }
                                : { type: "spring", stiffness: 450, damping: 35 }
                            }
                          />
                        )}
                        {isSelected && (
                          <motion.div
                            initial={prefersReduced ? false : { scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-1.5 right-1.5 z-10 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs"
                          >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
                          </motion.div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            ) : (
              <div className="py-2">
                <PersonUploadDropzone
                  onFileSelected={handleFileDrop}
                  disabled={createUploadMutation.isPending}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
