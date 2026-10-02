import React from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Shirt01Icon } from "@hugeicons/core-free-icons"
import { AuthenticatedImage } from "../../../components/image"
import { StatusBadge } from "../../../components/feedback"
import { ROUTES } from "../../../app/route-paths"
import { resolveMediaUrl } from "../../../lib/utils/media-url"
import { cn } from "../../../lib/utils"
import type { TryOnListItem } from "../types"

export interface TryOnHistoryCardProps {
  job: TryOnListItem
  onDelete?: (jobId: string) => void
  className?: string
}

function formatJobDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return "Recently"
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return "Recently"
  }
}

export function TryOnHistoryCard({
  job,
  onDelete,
  className,
}: TryOnHistoryCardProps) {
  const isTerminal = job.status === "succeeded" || job.status === "failed"
  const isSucceeded = job.status === "succeeded"
  const isProcessing = job.status === "processing"
  const isFailed = job.status === "failed"

  const resultImageUrl = job.result?.image_url || job.result_image_url
  const outfitThumbnail = job.outfit?.thumbnail_url
  const outfitName = job.outfit?.name || "Virtual Try-On"
  const outfitCategory = job.outfit?.category
  const formattedDate = formatJobDate(job.created_at)

  const detailUrl = ROUTES.app.tryOnDetail(job.id)

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete && isTerminal) {
      onDelete(job.id)
    }
  }

  return (
    <article
      aria-label={`Try-on: ${outfitName}, ${job.status}`}
      className={cn(
        "group relative rounded-2xl overflow-hidden border bg-surface flex flex-col transition-all duration-200",
        isFailed
          ? "border-danger/30 hover:border-danger/50"
          : "border-border/80 hover:border-border-strong hover:shadow-xs",
        className
      )}
    >
      {/* Visual Thumbnail / Preview Area as primary Link */}
      <Link
        to={detailUrl}
        aria-label={`Open try-on for ${outfitName}`}
        className="block relative overflow-hidden bg-surface-subtle aspect-[3/4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isSucceeded && resultImageUrl ? (
          <AuthenticatedImage
            src={resultImageUrl}
            requireAuth={true}
            alt={`Try-on result for ${outfitName}`}
            aspectRatio="3/4"
            objectFit="cover"
            className="size-full transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : outfitThumbnail ? (
          <div className="size-full relative">
            <AuthenticatedImage
              src={resolveMediaUrl(outfitThumbnail)}
              alt={outfitName}
              aspectRatio="3/4"
              objectFit="contain"
              className={cn(
                "size-full p-6",
                isProcessing && "animate-pulse motion-reduce:animate-none"
              )}
            />
            {isProcessing && (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-surface/40 backdrop-blur-[1px]"
              />
            )}
          </div>
        ) : (
          <div className="size-full flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
            <HugeiconsIcon icon={Shirt01Icon} className="size-8 opacity-40" />
            <span className="text-[11px] font-mono uppercase tracking-wider opacity-60">
              {job.status}
            </span>
          </div>
        )}

        {/* Top Floating Status Badge */}
        <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
          <StatusBadge status={job.status} />
        </div>

        {/* Paired garment thumbnail badge on tablet & desktop */}
        {isSucceeded && resultImageUrl && outfitThumbnail && (
          <div
            className="hidden sm:block absolute bottom-2.5 left-2.5 z-10 size-9 rounded-lg border border-border/80 bg-surface/90 backdrop-blur-xs overflow-hidden shadow-2xs pointer-events-none"
            title={`Paired with ${outfitName}`}
          >
            <AuthenticatedImage
              src={resolveMediaUrl(outfitThumbnail)}
              alt=""
              aspectRatio="1/1"
              objectFit="contain"
              className="size-full p-0.5"
            />
          </div>
        )}
      </Link>

      {/* Card Body with Context and Rich Metadata */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
        <div className="space-y-1">
          <Link
            to={detailUrl}
            className="block text-xs font-semibold text-foreground truncate hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
            title={outfitName}
          >
            {outfitName}
          </Link>

          <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
            <span className="truncate capitalize">{outfitCategory || "Apparel"}</span>
            <div className="flex items-center gap-1.5 shrink-0 font-mono">
              {job.result?.width && job.result?.height && (
                <span className="hidden lg:inline-block text-[10px] bg-surface-subtle px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground">
                  {job.result.width}×{job.result.height}
                </span>
              )}
              <time dateTime={job.created_at} className="shrink-0">
                {formattedDate}
              </time>
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <Link
            to={detailUrl}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View details &rarr;
          </Link>

          {isTerminal && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label={`Delete try-on for ${outfitName}`}
              title="Delete try-on"
              className="size-7 -mr-1 rounded-md flex items-center justify-center text-danger hover:bg-danger-subtle border border-danger/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger"
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
