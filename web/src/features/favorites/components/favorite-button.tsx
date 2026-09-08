import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FavouriteIcon, Loading03Icon } from "@hugeicons/core-free-icons"
import { motion, useReducedMotion } from "motion/react"
import { useToggleFavorite } from "../hooks/use-toggle-favorite"
import type { OutfitListItem } from "../../outfits/types"
import { cn } from "@/lib/utils"

export interface FavoriteButtonProps {
  outfitId: string
  isFavorite: boolean
  outfitName?: string
  outfit?: OutfitListItem
  className?: string
  size?: "sm" | "md"
}

export function FavoriteButton({
  outfitId,
  isFavorite,
  outfitName,
  outfit,
  className,
  size = "md",
}: FavoriteButtonProps) {
  const shouldReduceMotion = useReducedMotion()
  const { mutate, isPending, variables } = useToggleFavorite()

  // Strict isolation: only this specific outfit button displays pending state
  const isItemPending = isPending && variables?.outfitId === outfitId

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (isItemPending) return

    // Mutation dispatched immediately without artificial delay
    mutate({
      outfitId,
      currentIsFavorite: isFavorite,
      outfit,
    })
  }

  const label = isFavorite
    ? `Remove ${outfitName || "outfit"} from favorites`
    : `Add ${outfitName || "outfit"} to favorites`

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isItemPending}
      aria-label={label}
      aria-pressed={isFavorite}
      title={label}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "size-8 min-w-8 min-h-8" : "size-10 min-w-10 min-h-10",
        "bg-surface/85 backdrop-blur-xs border border-border/80 text-foreground hover:bg-surface hover:border-border-strong hover:scale-105 active:scale-95 shadow-xs",
        isFavorite && "border-border-strong bg-surface",
        className
      )}
    >
      {isItemPending ? (
        <HugeiconsIcon
          icon={Loading03Icon}
          className={cn("animate-spin text-muted-foreground motion-reduce:animate-none", size === "sm" ? "size-3.5" : "size-4")}
        />
      ) : (
        <motion.span
          key={isFavorite ? "favorite" : "unfavorite"}
          initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.22,
            ease: [0.175, 0.885, 0.32, 1.275],
          }}
          className="inline-flex items-center justify-center pointer-events-none"
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            className={cn(
              "transition-colors duration-150",
              size === "sm" ? "size-4" : "size-4.5",
              isFavorite ? "fill-current text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          />
        </motion.span>
      )}
      <span className="sr-only">{label}</span>
    </button>
  )
}
