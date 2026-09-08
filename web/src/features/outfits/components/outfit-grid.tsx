import React from "react"
import { Shirt01Icon } from "@hugeicons/core-free-icons"
import { OutfitCard } from "./outfit-card"
import { EmptyState } from "@/components/feedback/empty-state"
import { ErrorState } from "@/components/feedback/error-state"
import { Button } from "@/components/ui/button"
import type { OutfitListItem } from "../types"
import { cn } from "@/lib/utils"

export interface OutfitGridProps {
  outfits: OutfitListItem[]
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  selectedStudioOutfitId?: string | null
  onOpenDetail: (outfitId: string) => void
  onSelectForStudio: (outfit: OutfitListItem) => void
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  skeletonCount?: number
  className?: string
}

export function OutfitGrid({
  outfits,
  isLoading = false,
  isError = false,
  error,
  selectedStudioOutfitId,
  onOpenDetail,
  onSelectForStudio,
  onRetry,
  emptyTitle = "No outfits found",
  emptyDescription = "No garments are available matching your current filter criteria.",
  emptyAction,
  skeletonCount = 12,
  className,
}: OutfitGridProps) {
  // 1. Error State
  if (isError) {
    return (
      <div className="py-12">
        <ErrorState
          title="We couldn't load the outfits"
          message={error?.message || "A network or server error occurred while retrieving catalogue garments."}
          action={
            onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            )
          }
        />
      </div>
    )
  }

  // 2. Loading State: Portrait Skeletons
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4",
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col rounded-2xl border border-border/60 bg-surface overflow-hidden shadow-xs animate-pulse"
          >
            <div className="aspect-[3/4] w-full bg-surface-subtle" />
            <div className="p-3.5 space-y-2">
              <div className="h-4 w-3/4 bg-surface-subtle rounded-md" />
              <div className="h-3 w-1/3 bg-surface-subtle rounded-md" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 3. Empty State
  if (outfits.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          icon={Shirt01Icon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    )
  }

  // 4. Grid of Garments
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4",
        className
      )}
    >
      {outfits.map((outfit) => (
        <OutfitCard
          key={outfit.id}
          outfit={outfit}
          isSelectedForStudio={selectedStudioOutfitId === outfit.id}
          onOpenDetail={onOpenDetail}
          onSelectForStudio={onSelectForStudio}
        />
      ))}
    </div>
  )
}
