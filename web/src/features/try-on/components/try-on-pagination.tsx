import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { cn } from "../../../lib/utils"

export interface TryOnPaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  onPageChange: (page: number) => void
  className?: string
}

export function TryOnPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  className,
}: TryOnPaginationProps) {
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
      aria-label="Try-on history pagination"
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border/80",
        className
      )}
    >
      <div className="text-xs text-muted-foreground font-mono order-2 sm:order-1">
        Page <span className="text-foreground font-medium">{currentPage}</span> of{" "}
        <span className="text-foreground font-medium">{totalPages}</span>
        {totalItems !== undefined && (
          <>
            {" "}
            &bull;{" "}
            <span className="text-foreground font-medium">{totalItems}</span>{" "}
            total {totalItems === 1 ? "try-on" : "try-ons"}
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className={cn(
            "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs font-medium transition-colors cursor-pointer select-none",
            "hover:bg-surface-raised hover:border-border-strong text-foreground",
            "disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          )}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
          <span className="hidden xs:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1">
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
                  "min-w-9 h-9 px-2 rounded-lg text-xs font-mono transition-colors cursor-pointer select-none",
                  "flex items-center justify-center",
                  isCurrent
                    ? "bg-primary text-primary-foreground font-medium shadow-2xs"
                    : "hover:bg-surface-raised border border-transparent hover:border-border text-muted-foreground hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                )}
              >
                {page}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className={cn(
            "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs font-medium transition-colors cursor-pointer select-none",
            "hover:bg-surface-raised hover:border-border-strong text-foreground",
            "disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          )}
        >
          <span className="hidden xs:inline">Next</span>
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
        </button>
      </div>
    </nav>
  )
}
