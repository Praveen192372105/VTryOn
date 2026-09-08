import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { OUTFIT_CATEGORIES, OUTFIT_CATEGORY_LABELS } from "../constants"
import type { OutfitCategory } from "../types"
import { cn } from "@/lib/utils"

export interface OutfitFiltersProps {
  selectedCategory: OutfitCategory | undefined
  onCategoryChange: (category: OutfitCategory | undefined) => void
  searchTerm: string | undefined
  onSearchChange: (search: string | undefined) => void
  className?: string
}

export function OutfitFilters({
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  className,
}: OutfitFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm || "")

  // Sync external search updates (e.g. Back/Forward navigation or clear)
  useEffect(() => {
    setLocalSearch(searchTerm || "")
  }, [searchTerm])

  // Debounce search update to parent URL state
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = localSearch.trim()
      if (trimmed !== (searchTerm || "")) {
        onSearchChange(trimmed.length > 0 ? trimmed : undefined)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, searchTerm, onSearchChange])

  const handleClearSearch = () => {
    setLocalSearch("")
    onSearchChange(undefined)
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2",
        className
      )}
    >
      {/* Category Filter Chips */}
      <div
        role="group"
        aria-label="Filter outfits by category"
        className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border text-xs overflow-x-auto max-w-full scrollbar-none"
      >
        <button
          type="button"
          onClick={() => onCategoryChange(undefined)}
          aria-pressed={selectedCategory === undefined}
          className={cn(
            "px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
            selectedCategory === undefined
              ? "bg-surface text-foreground border border-border shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
          )}
        >
          All
        </button>

        {OUTFIT_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category
          const label = OUTFIT_CATEGORY_LABELS[category]
          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              aria-pressed={isSelected}
              className={cn(
                "px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                isSelected
                  ? "bg-surface text-foreground border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Text Search Input */}
      <div className="relative w-full sm:w-64 shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          <HugeiconsIcon icon={Search01Icon} className="size-4" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search garments…"
          aria-label="Search garments"
          className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-border-strong focus:ring-1 focus:ring-ring transition-colors shadow-2xs"
        />
        {localSearch.length > 0 && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label="Clear search query"
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
