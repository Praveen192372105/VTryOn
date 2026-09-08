import { useState, useEffect, Suspense, lazy } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, useReducedMotion } from "motion/react"
import {
  Download01Icon,
  Shirt01Icon,
  PlusSignIcon,
  ViewIcon,
  LeftToRightListDashIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { ImageFrame } from "../../../components/image"
import { StatusBadge } from "../../../components/feedback"
import { Button } from "../../../components/ui/button"
import { clearSelectedOutfit } from "../../outfits"
import { fetchAuthenticatedBlob } from "@/lib/api"
import { resolveMediaUrl } from "@/lib/utils/media-url"
import { ROUTES } from "../../../app/route-paths"
import type { TryOnJob } from "../types"

// Lazy-load heavy image comparison utility for optimal initial bundle performance
const LazyImageCompare = lazy(() =>
  import("../../../components/image/image-compare").then((module) => ({
    default: module.ImageCompare,
  }))
)

export interface ResultViewerProps {
  job: TryOnJob
  personImageUrl?: string | null
  outfitName?: string | null
  onDelete?: () => void
  className?: string
}

export function ResultViewer({
  job,
  personImageUrl,
  outfitName,
  onDelete,
  className,
}: ResultViewerProps) {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [viewMode, setViewMode] = useState<"result" | "compare">("result")
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null)
  const [isImageDecoded, setIsImageDecoded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const rawResultUrl = job.result?.image_url || job.result_image_url
  const canCompare = Boolean(personImageUrl && rawResultUrl)

  // Fetch private authenticated result media and manage Object URL lifecycle
  useEffect(() => {
    if (!rawResultUrl) return

    let isCancelled = false
    let currentObjectUrl: string | null = null
    const targetUrl = resolveMediaUrl(rawResultUrl)

    fetchAuthenticatedBlob(targetUrl)
      .then((blob) => {
        if (!isCancelled && blob instanceof Blob) {
          currentObjectUrl = URL.createObjectURL(blob)
          setResultBlobUrl(currentObjectUrl)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          // Fallback to resolved target url
          setResultBlobUrl(targetUrl)
        }
      })

    return () => {
      isCancelled = true
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl)
      }
    }
  }, [rawResultUrl])

  // Decode result image before revealing so transition is a seamless crossfade
  useEffect(() => {
    if (!resultBlobUrl) {
      setIsImageDecoded(false)
      return
    }

    if (shouldReduceMotion) {
      setIsImageDecoded(true)
      return
    }

    let isCurrent = true
    const img = new Image()
    img.src = resultBlobUrl

    if (typeof img.decode === "function") {
      img
        .decode()
        .then(() => {
          if (isCurrent) setIsImageDecoded(true)
        })
        .catch(() => {
          if (isCurrent) setIsImageDecoded(true)
        })
    } else {
      img.onload = () => {
        if (isCurrent) setIsImageDecoded(true)
      }
      img.onerror = () => {
        if (isCurrent) setIsImageDecoded(true)
      }
    }

    return () => {
      isCurrent = false
    }
  }, [resultBlobUrl, shouldReduceMotion])

  // Download authenticated result image as a clean jpeg
  const handleDownload = async () => {
    if (!rawResultUrl || isDownloading) return
    setIsDownloading(true)
    try {
      const targetUrl = resolveMediaUrl(rawResultUrl)
      const blob = await fetchAuthenticatedBlob(targetUrl)
      if (blob instanceof Blob) {
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = downloadUrl
        a.download = `v-try-on-${job.id}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)
      }
    } catch {
      // Ignored: central client error handler reports network failure
    } finally {
      setIsDownloading(false)
    }
  }

  const handleTryAnotherOutfit = () => {
    clearSelectedOutfit()
    navigate(
      ROUTES.app.studioWithParams({
        person: job.person_upload_id,
      })
    )
  }

  const handleCreateAnother = () => {
    navigate(ROUTES.app.studio)
  }

  if (!rawResultUrl && job.status === "succeeded") {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 text-center max-w-md mx-auto space-y-3">
        <StatusBadge status="succeeded" />
        <h3 className="text-base font-semibold text-foreground">Your try-on finished</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The try-on completed successfully, but the result image is temporarily unavailable.
        </p>
        <Button onClick={() => navigate(ROUTES.app.history)} variant="outline" size="sm">
          Check in History
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toggle View Mode (Single Result vs Interactive Compare) */}
        {canCompare && (
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 rounded-xl bg-surface border border-border shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("result")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "result"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HugeiconsIcon icon={ViewIcon} className="size-3.5" />
                <span>Result</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compare")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "compare"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HugeiconsIcon icon={LeftToRightListDashIcon} className="size-3.5" />
                <span>Compare with Original</span>
              </button>
            </div>
          </div>
        )}

        {/* Responsive Workspace Grid:
            Phone: Full-width image, controls below (grid-cols-1)
            Tablet: Wide image + metadata (max-w-3xl feel)
            Desktop: Large comparison canvas (col-span-7/8) + side metadata & controls (col-span-5/4)
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Hero Visual Display / Comparison Canvas */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="relative rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
              {viewMode === "compare" && canCompare && personImageUrl && resultBlobUrl ? (
                <Suspense
                  fallback={
                    <div className="w-full aspect-[3/4] flex items-center justify-center bg-surface-subtle text-muted-foreground">
                      <HugeiconsIcon icon={Loading03Icon} className="size-6 animate-spin motion-reduce:animate-none" />
                    </div>
                  }
                >
                  <LazyImageCompare
                    originalSrc={personImageUrl}
                    resultSrc={resultBlobUrl}
                    originalAlt="Your original photo"
                    resultAlt={`Virtual try-on look${outfitName ? ` fitted with ${outfitName}` : ""}`}
                    aspectRatio="3/4"
                    className="w-full"
                  />
                </Suspense>
              ) : (
                <div className="w-full aspect-[3/4] max-h-[75vh] lg:max-h-[82vh] flex items-center justify-center bg-surface-subtle overflow-hidden relative">
                  {/* Processing/Loading Skeleton */}
                  {(!resultBlobUrl || !isImageDecoded) && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-surface-subtle"
                      role="status"
                      aria-label="Loading result image"
                    >
                      <HugeiconsIcon icon={Loading03Icon} className="size-6 animate-spin motion-reduce:animate-none" />
                      <span className="text-xs font-mono">Loading private result…</span>
                    </div>
                  )}

                  {/* Decoded Result Image with Crossfade */}
                  {resultBlobUrl && (
                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: isImageDecoded ? 1 : 0 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.28,
                        ease: "easeOut",
                      }}
                      className="size-full flex items-center justify-center p-2 sm:p-4"
                    >
                      <ImageFrame
                        src={resultBlobUrl}
                        alt={`Virtual try-on result${outfitName ? ` fitted with ${outfitName}` : ""}`}
                        aspectRatio="auto"
                        objectFit="contain"
                        className="max-h-full max-w-full w-auto h-auto object-contain mx-auto my-auto rounded-xl shadow-xs"
                        containerClassName="size-full max-h-full max-w-full flex items-center justify-center !border-0 !bg-transparent !aspect-auto shadow-none"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Succeeded indicator tag */}
              <div className="absolute top-3 right-3 z-10">
                <StatusBadge status="succeeded" />
              </div>
            </div>
          </div>

          {/* Context metadata & action controls (Side panel on Desktop, stacked on Phone/Tablet) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 space-y-5">
            <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row lg:flex-col justify-between gap-2 border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Your look is ready
                  </h2>
                  {outfitName && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fitted with <span className="text-foreground font-medium">{outfitName}</span>
                    </p>
                  )}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {job.finished_at || job.completed_at
                    ? new Date(job.finished_at || job.completed_at!).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Just now"}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={handleTryAnotherOutfit}
                  className="gap-2 text-xs font-medium cursor-pointer w-full justify-center"
                >
                  <HugeiconsIcon icon={Shirt01Icon} className="size-3.5" />
                  <span>Try another outfit</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCreateAnother}
                  className="gap-2 text-xs font-medium cursor-pointer w-full justify-center"
                >
                  <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                  <span>New try-on</span>
                </Button>

                <Button
                  onClick={handleDownload}
                  disabled={!resultBlobUrl || isDownloading}
                  className="gap-2 text-xs font-medium cursor-pointer w-full justify-center"
                >
                  {isDownloading ? (
                    <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
                  ) : (
                    <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
                  )}
                  <span>{isDownloading ? "Downloading…" : "Download look"}</span>
                </Button>
              </div>

              {/* Sizing Disclaimer and Secondary Delete Action */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start justify-between gap-2 pt-3 border-t border-border/50 text-[11px] text-muted-foreground/80">
                <span>Generated results are visual interpretations, not sizing guarantees.</span>
                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="text-muted-foreground hover:text-danger hover:underline transition-colors cursor-pointer shrink-0"
                  >
                    Delete this look
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
