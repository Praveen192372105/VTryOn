import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  Loading03Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "../../lib/utils"
import { useReducedMotion } from "../../hooks/use-reduced-motion"

export type CanonicalTryOnStatus = "queued" | "processing" | "succeeded" | "failed"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: CanonicalTryOnStatus
  showIcon?: boolean
}

interface StatusConfig {
  label: string
  icon: typeof Clock01Icon
  className: string
  iconClassName: string
  animate: boolean
}

const STATUS_CONFIGS: Record<CanonicalTryOnStatus, StatusConfig> = {
  queued: {
    label: "Waiting to start",
    icon: Clock01Icon,
    className: "bg-surface-subtle text-muted-foreground border-border",
    iconClassName: "text-muted-foreground",
    animate: false,
  },
  processing: {
    label: "Creating your look",
    icon: Loading03Icon,
    className: "bg-surface-raised text-foreground border-border-strong",
    iconClassName: "text-foreground",
    animate: true,
  },
  succeeded: {
    label: "Ready",
    icon: CheckmarkCircle02Icon,
    className: "bg-success-subtle/25 text-success border-success/30",
    iconClassName: "text-success",
    animate: false,
  },
  failed: {
    label: "Couldn't finish",
    icon: AlertCircleIcon,
    className: "bg-danger-subtle/25 text-danger border-danger/30",
    iconClassName: "text-danger",
    animate: false,
  },
}

export function StatusBadge({
  status,
  showIcon = true,
  className,
  ...props
}: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.queued
  const prefersReduced = useReducedMotion()

  return (
    <div
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono uppercase tracking-wider select-none",
        config.className,
        className
      )}
      {...props}
    >
      {showIcon && (
        <HugeiconsIcon
          icon={config.icon}
          strokeWidth={2}
          className={cn(
            "size-3 shrink-0",
            config.iconClassName,
            config.animate && !prefersReduced && "animate-spin"
          )}
        />
      )}
      <span className="truncate">{config.label}</span>
    </div>
  )
}
