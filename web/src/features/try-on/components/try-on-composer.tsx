import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, SparklesIcon, AlertCircleIcon } from "@hugeicons/core-free-icons"
import { PersonSelector } from "./person-selector"
import { OutfitSelector } from "./outfit-selector"
import { useCreateTryOn } from "../hooks/use-create-try-on"
import { useStudioSelection } from "../hooks/use-studio-selection"
import { useRateLimitCountdown } from "../../../hooks/use-rate-limit-countdown"
import { normalizeApiError } from "../../../lib/api/errors"
import { ROUTES } from "../../../app/route-paths"
import { Button } from "../../../components/ui/button"
import type { TryOnJob } from "../types"

export interface TryOnComposerProps {
  onJobCreated?: (job: TryOnJob) => void
  onUploadClick?: () => void
  className?: string
}

export function TryOnComposer({
  onJobCreated,
  onUploadClick,
  className,
}: TryOnComposerProps) {
  const {
    personUploadId: selectedPersonId,
    outfitId: selectedOutfitId,
    setPersonUploadId: setSelectedPersonId,
    setOutfitId: setSelectedOutfitId,
  } = useStudioSelection()

  const navigate = useNavigate()
  const [submissionError, setSubmissionError] = useState<{
    message: string
    requestId?: string
    retryAfterSeconds?: number
  } | null>(null)
  const isSubmittingRef = React.useRef(false)

  const { secondsLeft, isCountingDown } = useRateLimitCountdown(
    submissionError?.retryAfterSeconds
  )

  const createMutation = useCreateTryOn()
  const isSubmitting = createMutation.isPending
  const canGenerate = Boolean(
    selectedPersonId && selectedOutfitId && !isSubmitting && !isCountingDown
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingRef.current || isSubmitting || isCountingDown || !selectedPersonId || !selectedOutfitId) return

    isSubmittingRef.current = true
    setSubmissionError(null)

    try {
      const job = await createMutation.mutateAsync({
        person_upload_id: selectedPersonId,
        outfit_id: selectedOutfitId,
      })

      if (onJobCreated) {
        onJobCreated(job)
      } else {
        navigate(ROUTES.app.tryOnDetail(job.id))
      }
    } catch (err: unknown) {
      const normalized = normalizeApiError(err)
      setSubmissionError({
        message:
          normalized.message || "Failed to start try-on. Please verify your selections and try again.",
        requestId: normalized.requestId,
        retryAfterSeconds: normalized.retryAfterSeconds,
      })
    } finally {
      isSubmittingRef.current = false
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
    >
      <div className="space-y-8">
        {/* Studio Responsive Workspace:
            Phone: Sequential cards (grid-cols-1)
            Tablet: Adaptive split (md:grid-cols-2)
            Desktop: Person/outfit workspace split (lg:grid-cols-12, 7 cols for Person, 5 cols for Outfit)
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* 01 — Person Selection Panel */}
          <div className="md:col-span-1 lg:col-span-7 xl:col-span-7">
            <PersonSelector
              selectedId={selectedPersonId}
              onSelect={(id) => {
                setSelectedPersonId(id)
                setSubmissionError(null)
              }}
              onUploadClick={onUploadClick}
            />
          </div>

          {/* 02 — Outfit Selection Panel */}
          <div className="md:col-span-1 lg:col-span-5 xl:col-span-5">
            <OutfitSelector
              selectedId={selectedOutfitId}
              onSelect={(id) => {
                setSelectedOutfitId(id)
                setSubmissionError(null)
              }}
            />
          </div>
        </div>

        {/* Inline Submission Error Alert if creation failed */}
        {submissionError && (
          <div
            role="alert"
            className="flex items-start gap-3 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs"
          >
            <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="leading-relaxed font-normal">
                {isCountingDown
                  ? `Too many requests. Please wait ${secondsLeft}s before trying again.`
                  : submissionError.message}
              </p>
              {submissionError.requestId && (
                <p className="text-[10px] font-mono opacity-80">
                  Reference: {submissionError.requestId}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Generate Action Area */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground font-mono order-2 sm:order-1">
            {!selectedPersonId && !selectedOutfitId
              ? "Choose a photo and outfit to continue."
              : !selectedPersonId
              ? "Add or select your photo to continue."
              : !selectedOutfitId
              ? "Choose an outfit to continue."
              : isCountingDown
              ? `Rate limited. Please wait ${secondsLeft}s.`
              : "Ready to create your look."}
          </div>

          <div className="w-full sm:w-auto flex flex-col items-center sm:items-end gap-1.5 order-1 sm:order-2">
            <Button
              type="submit"
              disabled={!canGenerate}
              size="lg"
              className="w-full sm:w-auto px-8 font-medium gap-2 disabled:opacity-40 cursor-pointer h-12 text-sm shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin motion-reduce:animate-none" />
                  <span>Starting your try-on…</span>
                </>
              ) : isCountingDown ? (
                <span>Wait {secondsLeft}s</span>
              ) : (
                <>
                  <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                  <span>Generate Try-On</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

