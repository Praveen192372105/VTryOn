import { cn } from "../../lib/utils"

export interface PageSkeletonProps {
  className?: string
  cardsCount?: number
}

export function PageSkeleton({ className, cardsCount = 6 }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto w-full", className)} role="status" aria-label="Loading page content">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-md" />
        <div className="h-4 w-80 bg-muted/60 rounded-md" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <ImageSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export interface ImageSkeletonProps {
  aspectRatio?: string
  className?: string
}

export function ImageSkeleton({ aspectRatio = "aspect-[3/4]", className }: ImageSkeletonProps) {
  return (
    <div
      className={cn(
        "w-full rounded-xl bg-muted/60 border border-border/40 animate-pulse relative overflow-hidden",
        aspectRatio,
        className
      )}
      role="status"
      aria-label="Loading image"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  )
}
