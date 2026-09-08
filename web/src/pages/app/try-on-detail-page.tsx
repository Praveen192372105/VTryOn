import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import {
  useTryOnJob,
  useDeleteTryOn,
  ResultViewer,
  TryOnProcessing,
  TryOnFailure,
  TryOnDeleteDialog,
} from "../../features/try-on"
import { usePersonUploads } from "../../features/uploads"
import { useOutfit } from "../../features/outfits"
import { PageHeader } from "../../components/layout"
import { ErrorState } from "../../components/feedback"
import { Spinner } from "../../components/ui/spinner"
import { Button } from "../../components/ui/button"
import { ROUTES } from "../../app/route-paths"

export default function TryOnDetailPage() {
  const params = useParams<{ id?: string; jobId?: string }>()
  const jobId = params.jobId || params.id || ""
  const navigate = useNavigate()

  const { data: job, isLoading, error, refetch } = useTryOnJob(jobId)
  const { uploads } = usePersonUploads()
  const { data: outfit } = useOutfit(job?.outfit_id || "")

  const deleteMutation = useDeleteTryOn()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Status transitions polite live announcements (Section 169)
  const prevStatusRef = useRef<string | undefined>(job?.status)
  const announcementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (job?.status && prevStatusRef.current !== job.status) {
      prevStatusRef.current = job.status
      if (announcementRef.current) {
        const text =
          job.status === "queued"
            ? "Waiting to start"
            : job.status === "processing"
            ? "Creating your try-on"
            : job.status === "succeeded"
            ? "Your try-on is ready"
            : "We couldn't finish this try-on"
        announcementRef.current.textContent = text
      }
    }
  }, [job?.status])

  // Dynamic document title based on canonical status
  const pageTitle =
    job?.status === "succeeded"
      ? "Your Look"
      : job?.status === "failed"
      ? "Try-On Failed"
      : "Your Try-On"

  useDocumentTitle(pageTitle)

  const matchedUpload = uploads.find((u) => u.id === job?.person_upload_id)
  const personImageUrl =
    matchedUpload?.image_url || matchedUpload?.public_url || matchedUpload?.storage_path

  const outfitImageUrl = outfit?.image_url
  const outfitName = outfit?.name

  const isTerminal = job?.status === "succeeded" || job?.status === "failed"

  const handleDelete = async () => {
    if (!jobId) return
    try {
      await deleteMutation.mutateAsync(jobId)
      // Navigate to history replacing the current entry to prevent Back button re-renders
      navigate(ROUTES.app.history, { replace: true })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const headerActions = isTerminal ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsDeleteDialogOpen(true)}
      className="text-muted-foreground hover:text-danger hover:bg-danger-subtle/20 gap-1.5 text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Delete this try-on"
    >
      <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
      <span>Delete try-on</span>
    </Button>
  ) : undefined

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Screen reader polite live region for status announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <PageHeader
        title={pageTitle}
        description={`Reference: ${jobId}`}
        backHref={ROUTES.app.history}
        backLabel="Back to history"
        actions={headerActions}
      />

      {isLoading ? (
        <div className="aspect-[3/4] max-w-md mx-auto rounded-2xl border border-border bg-surface flex flex-col items-center justify-center gap-3 p-8">
          <Spinner className="size-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">
            Loading try-on details…
          </span>
        </div>
      ) : error || !job ? (
        <div className="max-w-md mx-auto">
          <ErrorState
            title="This try-on could not be found"
            message="The requested try-on record may have been deleted or the link is invalid."
            requestId={jobId}
            onRetry={() => refetch()}
            action={
              <button
                type="button"
                onClick={() => navigate(ROUTES.app.studio)}
                className="text-xs text-foreground hover:underline font-medium cursor-pointer"
              >
                Open Studio
              </button>
            }
          />
        </div>
      ) : job.status === "failed" ? (
        <TryOnFailure job={job} />
      ) : job.status === "succeeded" ? (
        <ResultViewer
          job={job}
          personImageUrl={personImageUrl}
          outfitName={outfitName}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />
      ) : (
        <TryOnProcessing
          job={job}
          personImageUrl={personImageUrl}
          outfitImageUrl={outfitImageUrl}
          outfitName={outfitName}
        />
      )}

      {/* Terminal Job Delete Confirmation Dialog */}
      <TryOnDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
