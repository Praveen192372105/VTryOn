import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Shirt01Icon,
  PlusSignIcon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  LinkSquare02Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"
import { useOutfits, useOutfit, GarmentUploadDropzone } from "../../outfits"
import { FavoriteButton } from "../../favorites"
import { ImageFrame } from "../../../components/image"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog"
import { resolveMediaUrl } from "@/lib/utils/media-url"
import { OUTFIT_CATEGORIES, OUTFIT_CATEGORY_LABELS } from "../../outfits/constants"
import { ROUTES } from "../../../app/route-paths"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { OutfitCategory } from "../../outfits/types"
import { cn } from "../../../lib/utils"

export interface OutfitSelectorProps {
  selectedId: string | null
  onSelect: (outfitId: string) => void
  className?: string
}

export function OutfitSelector({ selectedId, onSelect, className }: OutfitSelectorProps) {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerTab, setPickerTab] = useState<"catalogue" | "upload">("catalogue")
  const [pickerCategory, setPickerCategory] = useState<OutfitCategory | undefined>(undefined)

  // Fetch full details of the active selected outfit
  const { data: selectedOutfit, isLoading: isSelectedLoading, isError: isSelectedError } = useOutfit(
    selectedId || ""
  )

  // Outfits collection for in-context selector modal
  const { data: catalogueData, isLoading: isCatalogueLoading } = useOutfits({
    category: pickerCategory,
    page_size: 24,
  })
  const catalogueOutfits = catalogueData?.items || []

  const handleSelect = (outfitId: string) => {
    onSelect(outfitId)
    setIsPickerOpen(false)
  }

  const handleBrowseCatalogue = () => {
    setIsPickerOpen(false)
    navigate(ROUTES.app.outfits)
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
          02 — Outfit
        </span>
        {selectedOutfit && (
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="text-xs text-foreground hover:underline font-medium cursor-pointer"
          >
            Change outfit
          </button>
        )}
      </div>

      {/* Surface display */}
      {selectedId && isSelectedLoading ? (
        <div className="w-full aspect-[3/4] max-h-[460px] rounded-2xl bg-surface-subtle animate-pulse border border-border flex items-center justify-center">
          <HugeiconsIcon icon={Loading03Icon} className="size-6 text-muted-foreground animate-spin" />
        </div>
      ) : selectedId && isSelectedError ? (
        <div className="w-full aspect-[3/4] max-h-[460px] rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center justify-center text-center space-y-3">
          <p className="text-xs text-destructive font-medium">This outfit is no longer available.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPickerOpen(true)}
            className="text-xs"
          >
            Choose another outfit
          </Button>
        </div>
      ) : selectedOutfit ? (
        /* Selected State */
        <div className="relative group rounded-2xl border border-border bg-surface overflow-hidden shadow-2xs">
          <div className="relative w-full aspect-[3/4] max-h-[460px] bg-surface-subtle overflow-hidden">
            <ImageFrame
              src={resolveMediaUrl(selectedOutfit.image_url || selectedOutfit.thumbnail_url)}
              alt={selectedOutfit.name}
              aspectRatio="auto"
              objectFit="contain"
              containerClassName="size-full border-0 rounded-none bg-transparent"
              className="size-full"
            />
          </div>

          {/* Favorite button positioned in top right */}
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton
              outfitId={selectedOutfit.id}
              isFavorite={Boolean(selectedOutfit.is_favorite)}
              outfitName={selectedOutfit.name}
              size="sm"
            />
          </div>

          {/* Category indicator tag in top left */}
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-xs border border-border text-[11px] font-medium text-foreground shadow-2xs capitalize">
            {selectedOutfit.category}
          </div>

          {/* Bottom metadata and action */}
          <div className="p-3 bg-surface border-t border-border flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <h4 className="text-xs font-medium text-foreground truncate">
                {selectedOutfit.name}
              </h4>
              <p className="text-[11px] text-muted-foreground capitalize">
                {selectedOutfit.category}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPickerOpen(true)}
              className="text-xs h-7 px-2.5 shrink-0 cursor-pointer"
            >
              Change outfit
            </Button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsPickerOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setIsPickerOpen(true)
            }
          }}
          aria-label="Choose an outfit to see on yourself"
          className="w-full aspect-[3/4] max-h-[460px] border border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-border-strong hover:bg-surface-subtle/50 transition-colors cursor-pointer group bg-surface outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs"
        >
          <div className="size-12 rounded-full bg-surface-subtle border border-border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <HugeiconsIcon
              icon={Shirt01Icon}
              className="size-6 text-muted-foreground group-hover:text-foreground transition-colors"
            />
          </div>
          <h3 className="text-sm font-medium text-foreground tracking-tight">
            No outfit selected
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Choose an outfit you want to see on yourself.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setPickerTab("catalogue")
                setIsPickerOpen(true)
              }}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
              <span>Browse outfits</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setPickerTab("upload")
                setIsPickerOpen(true)
              }}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
              <span>Upload own</span>
            </Button>
          </div>
        </div>
      )}

      {/* Outfit Selector Dialog */}
      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 rounded-2xl bg-surface border border-border shadow-xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Select Garment
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Choose from the catalogue or upload your own garment photo.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleBrowseCatalogue}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Full catalogue</span>
              <HugeiconsIcon icon={LinkSquare02Icon} className="size-3.5" />
            </button>
          </DialogHeader>

          {/* Tab Selector */}
          <div className="flex gap-2 border-b border-border pb-3 pt-1">
            <button
              type="button"
              onClick={() => setPickerTab("catalogue")}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                pickerTab === "catalogue"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Catalogue Outfits ({catalogueOutfits.length})
            </button>
            <button
              type="button"
              onClick={() => setPickerTab("upload")}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5",
                pickerTab === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
              <span>Upload Your Garment</span>
            </button>
          </div>

          {pickerTab === "upload" ? (
            <div className="flex-1 overflow-y-auto py-3">
              <GarmentUploadDropzone
                onSuccess={(outfit) => {
                  handleSelect(outfit.id)
                }}
                onCancel={() => setPickerTab("catalogue")}
              />
            </div>
          ) : (
            <>
              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setPickerCategory(undefined)}
                  className={cn(
                    "px-3 py-1 rounded-full border transition-colors whitespace-nowrap cursor-pointer",
                    pickerCategory === undefined
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "border-border text-muted-foreground hover:text-foreground bg-surface"
                  )}
                >
                  All
                </button>
                {OUTFIT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPickerCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-full border transition-colors whitespace-nowrap cursor-pointer",
                      pickerCategory === cat
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "border-border text-muted-foreground hover:text-foreground bg-surface"
                    )}
                  >
                    {OUTFIT_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Outfits Grid */}
              <div className="flex-1 overflow-y-auto py-2 min-h-[300px]">
                {isCatalogueLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="aspect-[3/4] rounded-xl bg-surface-subtle animate-pulse border border-border" />
                    ))}
                  </div>
                ) : catalogueOutfits.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <p className="text-xs text-muted-foreground">No garments found in this category.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPickerTab("upload")}
                      className="text-xs gap-1.5"
                    >
                      <HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
                      <span>Upload your own garment</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {/* Quick upload tile as the first item */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setPickerTab("upload")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setPickerTab("upload")
                        }
                      }}
                      className="cursor-pointer rounded-xl border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center text-center p-3 group aspect-[3/4] bg-surface"
                    >
                      <div className="size-10 rounded-full bg-surface-subtle border border-border flex items-center justify-center mb-2 group-hover:scale-105 group-hover:border-primary transition-all">
                        <HugeiconsIcon icon={Upload01Icon} className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Upload Garment</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Use your own photo</p>
                    </div>

                    {catalogueOutfits.map((outfit) => {
                      const isSelected = selectedId === outfit.id
                      return (
                        <div
                          key={outfit.id}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          aria-label={`Select ${outfit.name}`}
                          onClick={() => handleSelect(outfit.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handleSelect(outfit.id)
                            }
                          }}
                          className={cn(
                            "cursor-pointer rounded-xl transition-all relative overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-primary border border-border bg-surface",
                            isSelected ? "border-primary shadow-xs" : "hover:opacity-90"
                          )}
                        >
                          <div className="aspect-[3/4] bg-surface-subtle flex items-center justify-center p-2">
                            <ImageFrame
                              src={resolveMediaUrl(outfit.image_url)}
                              alt={outfit.name}
                              aspectRatio="3/4"
                              objectFit="contain"
                              className="size-full"
                            />
                          </div>
                          <div className="p-2 border-t border-border bg-surface">
                            <p className="text-xs font-medium text-foreground truncate">{outfit.name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{outfit.category}</p>
                          </div>
                          {isSelected && (
                            <motion.div
                              layoutId="outfit-picker-selection-ring"
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
                              className="absolute top-2 right-2 z-10 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs"
                            >
                              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
