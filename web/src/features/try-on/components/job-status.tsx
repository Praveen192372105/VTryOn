import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  Loading03Icon,
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
      color: "text-muted-foreground bg-surface-subtle border-border",
      iconColor: "text-muted-foreground",
      animate: false,
    },
    processing: {
      label: "Creating your look",
      description: "Our AI pipeline is synthesizing garment drape and fit.",
      icon: Loading03Icon,
      color: "text-foreground bg-brand-soft border-brand/35",
      iconColor: "text-brand",
      animate: true,
    },
    succeeded: {
      label: "Your look is ready",
      description: "Generation complete. High-resolution render ready.",
      icon: CheckmarkCircle02Icon,
      color: "text-success bg-success-subtle border-success/30",
      iconColor: "text-success",
      animate: false,
    },
    failed: {
      label: "We couldn't create this look",
      description: errorMessage || "The generation failed. Please try a different pose or garment.",
      icon: AlertCircleIcon,
      color: "text-danger bg-danger-subtle border-danger/30",
      iconColor: "text-danger",
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
          "flex items-center justify-center w-8 h-8 rounded-full bg-surface/75 shrink-0",
          config.iconColor,
          config.animate && "animate-spin"
        )}
      >
        <HugeiconsIcon icon={config.icon} className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-medium tracking-tight text-foreground leading-tight">
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground truncate mt-0.5">
          {config.description}
        </span>
      </div>
    </div>
  )
}
