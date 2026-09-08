import { useState } from "react"
import { Link } from "react-router-dom"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { TryOnHistoryCard } from "./try-on-history-card"
import { TryOnDeleteDialog } from "./try-on-delete-dialog"
import { useDeleteTryOn } from "../hooks/use-delete-try-on"
import { EmptyState, ErrorState } from "../../../components/feedback"
import { ROUTES } from "../../../app/route-paths"
import { buttonVariants } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"
import type { TryOnListItem } from "../types"

export interface TryOnHistoryGridProps {
  jobs: TryOnListItem[]
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function TryOnHistoryGrid({
  jobs,
  isLoading = false,
  isError = false,
  error,
  onRetry,
  className,
}: TryOnHistoryGridProps) {
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const deleteMutation = useDeleteTryOn()

  const handleDeleteConfirm = async () => {
    if (!deletingJobId) return
    try {
      await deleteMutation.mutateAsync(deletingJobId)
    } finally {
      setDeletingJobId(null)
    }
  }

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5", className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-surface overflow-hidden flex flex-col"
          >
            <div className="aspect-[3/4] bg-surface-subtle animate-pulse" />
            <div className="p-3.5 space-y-2.5">
              <div className="h-3.5 bg-surface-subtle animate-pulse rounded w-3/4" />
              <div className="flex justify-between">
                <div className="h-2.5 bg-surface-subtle animate-pulse rounded w-1/3" />
                <div className="h-2.5 bg-surface-subtle animate-pulse rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-12 max-w-md mx-auto">
        <ErrorState
          title="We couldn't load your try-on history"
          message={error?.message || "An unexpected network error occurred while retrieving your past looks."}
          onRetry={onRetry}
        />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          icon={Clock01Icon}
          title="No try-ons yet"
          description="Create your first virtual try-on in the Studio and it will appear here."
          action={
            <Link
              to={ROUTES.app.studio}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Open Studio
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5",
          className
        )}
      >
        {jobs.map((job) => (
          <TryOnHistoryCard
            key={job.id}
            job={job}
            onDelete={(id) => setDeletingJobId(id)}
          />
        ))}
      </div>

      <TryOnDeleteDialog
        open={Boolean(deletingJobId)}
        onOpenChange={(open) => {
          if (!open) setDeletingJobId(null)
        }}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
