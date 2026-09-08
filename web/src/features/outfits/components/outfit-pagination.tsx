import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface OutfitPaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  onPageChange: (page: number) => void
  className?: string
}

export function OutfitPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  className,
}: OutfitPaginationProps) {
  if (totalPages <= 1) return null

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Generate sensible page numbers to display
  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav
      aria-label="Outfit pages"
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border/80",
        className
      )}
    >
      {/* Optional total items summary */}
      <div className="text-xs text-muted-foreground font-mono order-2 sm:order-1">
        {totalItems !== undefined ? (
          <span>
            Showing page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span> ({totalItems} total)
          </span>
        ) : (
          <span>
            Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-surface text-foreground hover:bg-surface-subtle hover:border-border-strong disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
        </button>

        {pageNumbers.map((page) => {
          const isCurrent = page === currentPage
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "inline-flex items-center justify-center size-8 rounded-lg text-xs font-mono transition-colors cursor-pointer",
                isCurrent
                  ? "bg-foreground text-background font-semibold shadow-xs"
                  : "border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
              )}
            >
              {page}
            </button>
          )
        })}

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-surface text-foreground hover:bg-surface-subtle hover:border-border-strong disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
        </button>
      </div>
    </nav>
  )
}
