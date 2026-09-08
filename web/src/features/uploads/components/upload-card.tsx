import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, CheckmarkCircle02Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { motion, useReducedMotion } from "motion/react"
import { AuthenticatedImage } from "@/components/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PersonUpload } from "../types"

export interface UploadCardProps {
  upload: PersonUpload
  isSelected?: boolean
  onSelect?: (uploadId: string) => void
  onDelete?: (uploadId: string) => void
  onUseInStudio?: (uploadId: string) => void
  className?: string
}

function formatUploadDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return "Recent"
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return "Recent"
  }
}

export function UploadCard({
  upload,
  isSelected = false,
  onSelect,
  onDelete,
  onUseInStudio,
  className,
}: UploadCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const mediaUrl = upload.image_url || upload.public_url || upload.storage_path
  const dateLabel = formatUploadDate(upload.created_at)

  return (
    <div
      role="region"
      aria-label={`Upload from ${dateLabel}`}
      className={cn(
        "group relative rounded-2xl overflow-hidden border bg-surface flex flex-col transition-all duration-200",
        isSelected
          ? "border-primary shadow-sm"
          : "border-border/80 hover:border-border-strong",
        className
      )}
    >
      {isSelected && (
        <motion.div
          layoutId={shouldReduceMotion ? undefined : "upload-card-selection-ring"}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          className="absolute inset-0 rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background pointer-events-none z-10"
        />
      )}
      {/* Thumbnail Surface */}
      <div className="relative overflow-hidden">
        <AuthenticatedImage
          src={mediaUrl}
          alt={upload.original_filename || "Uploaded person portrait"}
          aspectRatio="3/4"
          objectFit="cover"
          selected={isSelected}
          actions={
            onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(upload.id)
                }}
                className="size-7 rounded-full bg-background/80 hover:bg-danger/20 text-muted-foreground hover:text-danger border border-border/60 backdrop-blur-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Delete photo"
                aria-label="Delete photo"
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
              </button>
            )
          }
        />
      </div>

      {/* Card Content & Action Bar */}
      <div className="p-3.5 flex items-center justify-between gap-2 border-t border-border/60">
        <div className="min-w-0">
          <p className="text-xs font-mono text-muted-foreground truncate">
            {dateLabel}
          </p>
          {isSelected ? (
            <div className="flex items-center gap-1 text-[11px] font-medium text-primary mt-0.5">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 shrink-0" />
              <span>Selected for Studio</span>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
              {upload.width && upload.height
                ? `${upload.width}×${upload.height} px`
                : "Portrait photo"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onUseInStudio ? (
            <Button
              size="xs"
              variant={isSelected ? "secondary" : "outline"}
              onClick={() => onUseInStudio(upload.id)}
              className="text-xs"
            >
              <HugeiconsIcon icon={SparklesIcon} className="size-3 mr-1" />
              <span>Use</span>
            </Button>
          ) : onSelect ? (
            <Button
              size="xs"
              variant={isSelected ? "secondary" : "outline"}
              onClick={() => onSelect(upload.id)}
              aria-pressed={isSelected}
              className="text-xs"
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
