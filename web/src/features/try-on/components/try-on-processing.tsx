import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { motion, useReducedMotion } from "motion/react"
import { StatusBadge } from "../../../components/feedback"
import { AuthenticatedImage, ImageFrame } from "../../../components/image"
import { resolveMediaUrl } from "@/lib/utils/media-url"
import type { TryOnJob } from "../types"

export interface TryOnProcessingProps {
  job: TryOnJob
  personImageUrl?: string | null
  outfitImageUrl?: string | null
  outfitName?: string | null
  className?: string
}

function useSimulatedProgress(job: TryOnJob) {
  const [progress, setProgress] = useState<number>(18)

  useEffect(() => {
    if (job.status === "succeeded" || job.status === "failed" || job.status === "queued") {
      return
    }

    // Processing state: compute progress relative to job started_at or created_at timestamp
    const startTime = job.started_at
      ? new Date(job.started_at).getTime()
      : job.created_at
        ? new Date(job.created_at).getTime()
        : Date.now()

    const timer = setInterval(() => {
      const elapsedSec = Math.max(0, (Date.now() - startTime) / 1000)
      // Realistic diffusion curve: gradual progression reflecting deep neural network steps
      // 0-45s: 15% -> 35% (Pose estimation & garment pre-processing)
      // 45s-180s: 35% -> 70% (Latent diffusion texture synthesis)
      // 180s+: asymptotic crawl towards 94% (Finalizing & decoding latent tensors)
      // Never reaches 95%+ until backend confirms status === 'succeeded'
      let calculated = 0
      if (elapsedSec < 45) {
        calculated = Math.round(15 + 20 * (elapsedSec / 45))
      } else if (elapsedSec < 180) {
        const t = (elapsedSec - 45) / (180 - 45)
        calculated = Math.round(35 + 35 * (1 - Math.exp(-2.5 * t)))
      } else {
        const extraSec = elapsedSec - 180
        calculated = Math.min(94, Math.round(70 + 24 * (1 - Math.exp(-extraSec / 120))))
      }
      setProgress((prev) => Math.max(prev, calculated))
    }, 500)

    return () => clearInterval(timer)
  }, [job.status, job.started_at, job.created_at])

  if (job.status === "succeeded") return 100
  if (job.status === "queued") return 12
  return progress
}

export function TryOnProcessing({
  job,
  personImageUrl,
  outfitImageUrl,
  outfitName,
  className,
}: TryOnProcessingProps) {
  const shouldReduceMotion = useReducedMotion()
  const isQueued = job.status === "queued"
  const prevStatusRef = useRef<string | undefined>(undefined)
  const announcementRef = useRef<HTMLDivElement>(null)
  const progress = useSimulatedProgress(job)

  // Status transitions announced politely to screen readers once per change
  useEffect(() => {
    if (prevStatusRef.current !== job.status) {
      prevStatusRef.current = job.status
      if (announcementRef.current) {
        announcementRef.current.textContent = isQueued
          ? "Waiting to start your try-on."
          : "Creating your try-on."
      }
    }
  }, [job.status, isQueued])

  const title = isQueued ? "Waiting to start" : "Creating your try-on"
  const subtitle = isQueued
    ? "Your try-on request is queued. Generation will begin automatically as soon as resources are allocated."
    : "Composing the garment with your photo using deep AI diffusion. On local hardware this may take several minutes—please keep this tab open."

  const getStageMessage = () => {
    if (isQueued) return "Waiting for GPU worker..."
    if (progress < 25) return "Analyzing pose & garment geometry..."
    if (progress < 50) return "Aligning fabric drape & contours..."
    if (progress < 75) return "Synthesizing AI diffusion textures..."
    if (progress < 90) return "Refining natural shadows & lighting..."
    if (progress < 96) return "Finalizing high-resolution render..."
    if (progress < 100) return "Polishing photorealistic details..."
    return "Complete! Rendering final image..."
  }

  return (
    <div
      role="status"
      aria-busy="true"
      className={className}
    >
      {/* Screen reader live region */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="max-w-xl mx-auto space-y-8">
        {/* Visual composition card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xs text-center relative overflow-hidden">
          {/* Subtle ambient gradient */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-radial from-primary/[0.03] via-transparent to-transparent pointer-events-none"
          />

          {/* Contextual dual thumbnail preview */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8">
            {/* Person photo preview */}
            <div className="relative group">
              <div className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden border border-border bg-surface-subtle shadow-xs">
                {personImageUrl ? (
                  <AuthenticatedImage
                    src={personImageUrl}
                    alt="Your selected photo"
                    aspectRatio="3/4"
                    objectFit="contain"
                    className="size-full"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-muted-foreground text-xs font-mono">
                    Photo
                  </div>
                )}
              </div>
              <span className="block text-[11px] font-mono text-muted-foreground mt-1.5 uppercase tracking-wider">
                Your Photo
              </span>
            </div>

            {/* Connecting transition indicator */}
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="w-8 h-px bg-border sm:w-12" />
              <div className="size-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground shadow-2xs">
                <HugeiconsIcon
                  icon={isQueued ? Clock01Icon : Loading03Icon}
                  className={`size-4 ${isQueued ? "" : "animate-spin motion-reduce:animate-none"}`}
                />
              </div>
              <div className="w-8 h-px bg-border sm:w-12" />
            </div>

            {/* Garment preview */}
            <div className="relative group">
              <div className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden border border-border bg-surface-subtle shadow-xs">
                {outfitImageUrl ? (
                  <ImageFrame
                    src={resolveMediaUrl(outfitImageUrl)}
                    alt={outfitName || "Selected outfit"}
                    aspectRatio="3/4"
                    objectFit="contain"
                    className="size-full"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-muted-foreground text-xs font-mono">
                    Garment
                  </div>
                )}
              </div>
              <span className="block text-[11px] font-mono text-muted-foreground mt-1.5 uppercase tracking-wider truncate max-w-[110px]">
                {outfitName || "Outfit"}
              </span>
            </div>
          </div>

          {/* Status badge & copy */}
          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex justify-center">
              <StatusBadge status={job.status} />
            </div>

            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>

            {/* Enhanced Animated Progress Percentage & Bar */}
            <div className="pt-2 pb-1 space-y-2">
              <div className="flex items-center justify-between text-xs max-w-xs sm:max-w-sm mx-auto px-0.5">
                <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[210px] flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>{getStageMessage()}</span>
                </span>
                <span className="font-mono text-xs font-semibold text-foreground shrink-0 tabular-nums">
                  {progress}%
                </span>
              </div>

              {/* Progress track */}
              <div
                className="w-full max-w-xs sm:max-w-sm h-2 sm:h-2.5 mx-auto bg-surface-subtle border border-border/80 rounded-full p-[2px] overflow-hidden relative shadow-inner"
                role="progressbar"
                aria-label={isQueued ? "Waiting in queue" : "Generating try-on"}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {/* Active progress fill with gradient & leading glow */}
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-200 dark:from-zinc-600 dark:via-zinc-300 dark:to-white shadow-xs"
                  style={{ width: `${progress}%` }}
                >
                  {/* Continuous traveling light flare beam */}
                  {!shouldReduceMotion && (
                    <motion.div
                      animate={{
                        x: ["-100%", "250%"],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: isQueued ? 2.4 : 1.3,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 w-3/4 bg-gradient-to-r from-transparent via-white to-transparent opacity-95 blur-[0.5px]"
                    />
                  )}

                  {/* Leading edge glowing beacon */}
                  {!shouldReduceMotion && (
                    <span className="absolute right-0 top-0 bottom-0 w-2.5 bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.9)] rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Truthful background policy message */}
          <div className="mt-8 pt-6 border-t border-border/60 text-xs text-muted-foreground/80 flex items-center justify-center gap-2">
            <span>You can leave this page. Your try-on will continue processing in the background.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
