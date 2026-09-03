import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  SparklesIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "../../../lib/utils"
import type { TryOnStatus } from "../types"

interface JobStatusProps {
  status: TryOnStatus
  className?: string
  errorMessage?: string | null
}

export function JobStatus({ status, className, errorMessage }: JobStatusProps) {
  const config = {
    queued: {
      label: "Waiting to start",
      description: "Your try-on request is in queue and will begin shortly.",
      icon: Clock01Icon,
      color: "text-zinc-400 bg-zinc-900/60 border-zinc-800",
      iconColor: "text-zinc-400",
      animate: false,
    },
    processing: {
      label: "Creating your look",
      description: "Our AI pipeline is synthesizing garment drape and fit.",
      icon: SparklesIcon,
      color: "text-zinc-200 bg-zinc-900/80 border-zinc-700/60",
      iconColor: "text-zinc-100",
      animate: true,
    },
    succeeded: {
      label: "Your look is ready",
      description: "Generation complete. High-resolution render ready.",
      icon: CheckmarkCircle02Icon,
      color: "text-emerald-300 bg-emerald-950/30 border-emerald-800/40",
      iconColor: "text-emerald-400",
      animate: false,
    },
    failed: {
      label: "We couldn't create this look",
      description: errorMessage || "The generation failed. Please try a different pose or garment.",
      icon: AlertCircleIcon,
      color: "text-red-300 bg-red-950/30 border-red-800/40",
      iconColor: "text-red-400",
      animate: false,
    },
  }[status]

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-lg border text-xs sm:text-sm",
        config.color,
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full bg-black/40 shrink-0",
          config.iconColor,
          config.animate && "animate-spin"
        )}
      >
        <HugeiconsIcon icon={config.icon} className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-medium tracking-tight text-white leading-tight">
          {config.label}
        </span>
        <span className="text-xs text-zinc-400 truncate mt-0.5">
          {config.description}
        </span>
      </div>
    </div>
  )
}
