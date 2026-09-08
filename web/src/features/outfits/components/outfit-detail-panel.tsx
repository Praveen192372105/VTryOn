import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ImageFrame } from "@/components/image/image-frame"
import { ErrorState } from "@/components/feedback/error-state"
import { FavoriteButton } from "../../favorites/components/favorite-button"
import { useOutfit } from "../hooks/use-outfits"
import { OUTFIT_CATEGORY_LABELS } from "../constants"
import type { OutfitResponse } from "../types"
import { resolveMediaUrl } from "@/lib/utils/media-url"

export interface OutfitDetailPanelProps {
  outfitId: string | null
  isSelectedForStudio?: boolean
  onClose: () => void
  onSelectForStudio: (outfit: OutfitResponse) => void
}

export function OutfitDetailPanel({
  outfitId,
  isSelectedForStudio = false,
  onClose,
  onSelectForStudio,
}: OutfitDetailPanelProps) {
  const isOpen = Boolean(outfitId)
  const { data: outfit, isLoading, isError, error, refetch } = useOutfit(outfitId || "")

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const categoryLabel =
    outfit?.category && OUTFIT_CATEGORY_LABELS[outfit.category]
      ? OUTFIT_CATEGORY_LABELS[outfit.category]
      : outfit?.category

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-0 flex flex-col bg-surface border-l border-border"
      >
        <div className="p-6 pb-2">
          <SheetHeader className="p-0 gap-1">
            <div className="text-2xs font-mono uppercase tracking-wider text-muted-foreground">
              Garment Detail
            </div>
            <SheetTitle className="text-lg font-medium tracking-tight text-foreground">
              {outfit?.name || "Outfit Detail"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Detailed view and virtual try-on action for {outfit?.name || "selected garment"}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Content Body */}
        <div className="flex-1 px-6 py-2 space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="aspect-[3/4] w-full rounded-2xl bg-surface-subtle" />
              <div className="h-6 w-2/3 bg-surface-subtle rounded-md" />
              <div className="h-4 w-1/3 bg-surface-subtle rounded-md" />
              <div className="h-16 w-full bg-surface-subtle rounded-md" />
            </div>
          ) : isError || !outfit ? (
            <div className="py-12">
              <ErrorState
                title="This outfit could not be found"
                message={
                  error?.message ||
                  "The requested outfit may have been unlisted or removed from the active catalogue."
                }
                action={
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Try again
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Garment Image */}
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-border/80 bg-surface-subtle shadow-xs">
                <ImageFrame
                  src={resolveMediaUrl(outfit.image_url)}
                  alt={`${outfit.name} garment`}
                  aspectRatio="3/4"
                  objectFit="contain"
                  className="size-full"
                />

                {isSelectedForStudio && (
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground shadow-xs">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" />
                    <span>Selected in Studio</span>
                  </div>
                )}
              </div>

              {/* Garment Meta & Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-2xs font-mono font-medium tracking-wide bg-surface-subtle border border-border text-muted-foreground uppercase">
                    {categoryLabel}
                  </span>
                  {outfit.is_active && (
                    <span className="text-2xs text-muted-foreground font-mono">
                      Active Catalogue
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-medium tracking-tight text-foreground">
                  {outfit.name}
                </h2>

                {outfit.description ? (
                  <p className="text-xs/relaxed text-muted-foreground">
                    {outfit.description}
                  </p>
                ) : (
                  <p className="text-xs/relaxed text-muted-foreground italic">
                    Editorial garment curated for high-fidelity diffusion fitting.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        {outfit && !isLoading && !isError && (
          <div className="p-6 pt-4 border-t border-border/80 bg-surface mt-auto flex items-center gap-3">
            <FavoriteButton
              outfitId={outfit.id}
              isFavorite={outfit.is_favorite}
              outfitName={outfit.name}
              outfit={outfit}
              size="md"
            />

            <Button
              onClick={() => onSelectForStudio(outfit)}
              className="flex-1 gap-2 font-medium cursor-pointer"
              size="lg"
            >
              <HugeiconsIcon icon={SparklesIcon} className="size-4" />
              <span>{isSelectedForStudio ? "Use in Studio" : "Try this outfit"}</span>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
