import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, RefreshIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { StatusBadge } from "../../../components/feedback"
import { Button } from "../../../components/ui/button"
import { ROUTES } from "../../../app/route-paths"
import type { TryOnJob } from "../types"

export interface TryOnFailureProps {
  job: TryOnJob
  className?: string
}

function mapFailureReason(code?: string | null, message?: string | null): string {
  if (code === "INVALID_INPUT") {
    return "The selected photo or garment could not be processed. Please try a different photo with clear posture or another outfit."
  }
  if (code === "TRYON_PROCESSING_FAILED") {
    return "We couldn't finish synthesizing this try-on. Please try again with another photo or garment."
  }
  if (code === "RESULT_STORAGE_FAILED") {
    return "The try-on was processed, but saving the result image failed. Please try again."
  }
  if (code === "TRYON_CAPACITY_LIMIT" || code === "USER_TRYON_CAPACITY_EXCEEDED") {
    return "You have reached the maximum active try-on limit. Please wait for an existing try-on to complete."
  }
  if (code === "TRYON_CAPACITY_UNAVAILABLE" || code === "SYSTEM_TRYON_CAPACITY_UNAVAILABLE") {
    return "Try-on creation is temporarily busy. Please try again shortly."
  }

  // Safe fallback if message is user-safe, otherwise generic fallback
  if (message && !message.toLowerCase().includes("catvton") && !message.toLowerCase().includes("cuda") && !message.toLowerCase().includes("celery")) {
    return message
  }

  return "We couldn't finish this try-on. You can try again with another photo or outfit."
}

export function TryOnFailure({ job, className }: TryOnFailureProps) {
  const navigate = useNavigate()

  const failureCode = job.error?.code || job.error_code
  const rawMessage = job.error?.message || job.error_message
  const userSafeExplanation = mapFailureReason(failureCode, rawMessage)

  const handleTryAgain = () => {
    // Navigate back to Studio restoring person and outfit selections via URL
    navigate(
      ROUTES.app.studioWithParams({
        person: job.person_upload_id,
        outfit: job.outfit_id,
      })
    )
  }

  const handleBackToHistory = () => {
    navigate(ROUTES.app.history)
  }

  return (
    <div
      role="alert"
      className={className}
    >
      <div className="max-w-lg mx-auto bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-6">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20">
          <HugeiconsIcon icon={AlertCircleIcon} className="size-6" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            <StatusBadge status="failed" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            We couldn't finish this try-on
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {userSafeExplanation}
          </p>
        </div>

        {/* Quiet support reference */}
        <div className="text-[11px] font-mono text-muted-foreground/70">
          Reference: {job.id}
          {failureCode ? ` · ${failureCode}` : ""}
        </div>

        {/* User-actionable recovery controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleBackToHistory}
            className="w-full sm:w-auto gap-2 text-xs cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
            <span>Back to history</span>
          </Button>

          <Button
            onClick={handleTryAgain}
            className="w-full sm:w-auto gap-2 text-xs font-medium cursor-pointer"
          >
            <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
            <span>Try again in Studio</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
