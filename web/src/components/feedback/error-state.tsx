import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, RefreshIcon, HourglassIcon } from "@hugeicons/core-free-icons"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import { useRateLimitCountdown } from "../../hooks/use-rate-limit-countdown"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message: string
  requestId?: string
  retryAfterSeconds?: number
  onRetry?: () => void
  action?: React.ReactNode
}

export function ErrorState({
  title = "Unable to complete request",
  message,
  requestId,
  retryAfterSeconds,
  onRetry,
  action,
  className,
  ...props
}: ErrorStateProps) {
  const { secondsLeft, isCountingDown } = useRateLimitCountdown(retryAfterSeconds)

  return (
    <div
      className={cn(
        "flex flex-col p-5 sm:p-6 rounded-2xl border border-danger/25 bg-danger-subtle/15 text-foreground max-w-lg mx-auto",
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-danger/10 text-danger border border-danger/20 shrink-0 mt-0.5">
          <HugeiconsIcon
            icon={isCountingDown ? HourglassIcon : Alert02Icon}
            className={cn("size-4.5", isCountingDown && "animate-pulse")}
          />
        </div>

        <div className="space-y-1 flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground tracking-tight">{title}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isCountingDown
              ? `Too many requests. Please wait ${secondsLeft}s before trying again.`
              : message}
          </p>

          {requestId && (
            <p className="text-[11px] text-muted-foreground/80 font-mono pt-1">
              Reference: <span className="select-all font-semibold">{requestId}</span>
            </p>
          )}

          {(onRetry || action) && (
            <div className="pt-3 flex items-center gap-2">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  disabled={isCountingDown}
                  leadingIcon={<HugeiconsIcon icon={RefreshIcon} className="size-3.5" />}
                >
                  {isCountingDown ? `Wait ${secondsLeft}s` : "Try again"}
                </Button>
              )}
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const ErrorPanel = ErrorState
