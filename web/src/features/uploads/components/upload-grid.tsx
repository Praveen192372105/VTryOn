import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { EmptyState, ErrorState } from "@/components/feedback"
import { Button } from "@/components/ui/button"
import { UploadCard } from "./upload-card"
import { cn } from "@/lib/utils"
import type { PersonUpload } from "../types"

export interface UploadGridProps {
  uploads: PersonUpload[]
  selectedId?: string | null
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onSelect?: (uploadId: string) => void
  onDelete?: (uploadId: string) => void
  onUseInStudio?: (uploadId: string) => void
  onUploadClick?: () => void
  onRetry?: () => void
  className?: string
}

export function UploadGrid({
  uploads,
  selectedId,
  isLoading = false,
  isError = false,
  error,
  onSelect,
  onDelete,
  onUseInStudio,
  onUploadClick,
  onRetry,
  className,
}: UploadGridProps) {
  if (isLoading) {
    return (
      <div
        data-testid="upload-grid-skeleton"
        className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", className)}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-surface overflow-hidden space-y-3 p-2"
          >
            <div className="aspect-[3/4] rounded-xl bg-surface-subtle animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-surface-subtle animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="We couldn't load your photos"
          message={
            error?.message ||
            "Unable to connect to the photo library. Please check your connection and try again."
          }
          onRetry={onRetry}
        />
      </div>
    )
  }

  if (uploads.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Camera01Icon}
          title="No photos yet"
          description="Add a photo to start creating virtual try-ons and exploring styles."
          action={
            onUploadClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUploadClick}
                leadingIcon={<HugeiconsIcon icon={PlusSignIcon} className="size-4" />}
              >
                Add photo
              </Button>
            )
          }
        />
      </div>
    )
  }

  return (
    <div
      data-testid="upload-grid"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {uploads.map((upload) => (
        <UploadCard
          key={upload.id}
          upload={upload}
          isSelected={selectedId === upload.id}
          onSelect={onSelect}
          onDelete={onDelete}
          onUseInStudio={onUseInStudio}
        />
      ))}
    </div>
  )
}
