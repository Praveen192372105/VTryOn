import React from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { ImageFrame } from "@/components/image/image-frame"
import { FavoriteButton } from "../../favorites/components/favorite-button"
import { OUTFIT_CATEGORY_LABELS } from "../constants"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { OutfitListItem } from "../types"
import { resolveMediaUrl } from "@/lib/utils/media-url"
import { cn } from "@/lib/utils"

export interface OutfitCardProps {
  outfit: OutfitListItem
  isSelectedForStudio?: boolean
  onOpenDetail: (outfitId: string) => void
  onSelectForStudio: (outfit: OutfitListItem) => void
  className?: string
}

export function OutfitCard({
  outfit,
  isSelectedForStudio = false,
  onOpenDetail,
  onSelectForStudio,
  className,
}: OutfitCardProps) {
  const prefersReduced = useReducedMotion()
  const categoryLabel = OUTFIT_CATEGORY_LABELS[outfit.category] || outfit.category

  const handleCardClick = () => {
    onOpenDetail(outfit.id)
  }

  const handleTryClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectForStudio(outfit)
  }

  return (
    <article
      data-testid={`outfit-card-${outfit.id}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-surface transition-all duration-200 overflow-hidden",
        isSelectedForStudio
          ? "border-primary ring-2 ring-primary/20 shadow-sm"
          : "border-border/80 hover:border-border-strong hover:shadow-xs",
        className
      )}
    >
      {isSelectedForStudio && (
        <motion.div
          layoutId="outfit-card-active-border"
          className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none z-20"
          transition={
            prefersReduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 450, damping: 35 }
          }
        />
      )}
      {/* Visual Image Presentation */}
      <div className="relative aspect-[3/4] w-full bg-surface-subtle overflow-hidden">
        <button
          type="button"
          onClick={handleCardClick}
          aria-label={`View details for ${outfit.name}`}
          className="absolute inset-0 size-full cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <ImageFrame
            src={resolveMediaUrl(outfit.image_url)}
            alt={`${outfit.name} garment`}
            aspectRatio="3/4"
            objectFit="contain"
            className="size-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        </button>

        {/* Floating Top Bar: Selected Status & Favorite Toggle */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
          {isSelectedForStudio ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-medium tracking-wide uppercase bg-primary text-primary-foreground shadow-xs pointer-events-auto">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3" />
              <span>Selected</span>
            </div>
          ) : (
            <span />
          )}

          <div className="pointer-events-auto ml-auto">
            <FavoriteButton
              outfitId={outfit.id}
              isFavorite={outfit.is_favorite}
              outfitName={outfit.name}
              outfit={outfit}
              size="sm"
            />
          </div>
        </div>

        {/* Hover / Focus Overlay CTA: Try this outfit */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 hidden sm:flex pointer-events-none">
          <button
            type="button"
            onClick={handleTryClick}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface/90 hover:bg-surface text-foreground text-xs font-medium border border-border shadow-md backdrop-blur-xs cursor-pointer transition-all duration-150 active:scale-95 pointer-events-auto"
          >
            <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
            <span>Try this outfit</span>
          </button>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="p-3.5 flex flex-col gap-1">
        <button
          type="button"
          onClick={handleCardClick}
          className="text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
        >
          <h3
            className="text-sm font-medium text-foreground truncate tracking-tight hover:underline"
            title={outfit.name}
          >
            {outfit.name}
          </h3>
        </button>

        <div className="flex items-center justify-between text-2xs text-muted-foreground font-mono">
          <span className="capitalize tracking-wide">{categoryLabel}</span>
          {/* Mobile direct CTA if needed */}
          <button
            type="button"
            onClick={handleTryClick}
            className="sm:hidden text-foreground underline font-sans font-medium text-xs py-0.5 cursor-pointer"
          >
            Try on
          </button>
        </div>
      </div>
    </article>
  )
}
