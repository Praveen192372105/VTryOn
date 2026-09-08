import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, HourglassIcon } from "@hugeicons/core-free-icons"
import { cn } from "../../../lib/utils"
import { useRateLimitCountdown } from "../../../hooks/use-rate-limit-countdown"

interface AuthFormErrorProps {
  message?: string | null
  requestId?: string | null
  retryAfterSeconds?: number | null
  className?: string
}

export function AuthFormError({
  message,
  requestId,
  retryAfterSeconds,
  className,
}: AuthFormErrorProps) {
  const { secondsLeft, isCountingDown, isFinished } = useRateLimitCountdown(
    retryAfterSeconds ?? undefined
  )

  if (!message && !isCountingDown) return null

  const displayMessage = isCountingDown
    ? `Too many attempts. Please wait ${secondsLeft}s before trying again.`
    : isFinished
    ? "You may now try again."
    : message

  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-danger/25 bg-danger/10 p-3.5 text-xs text-danger space-y-1.5 flex items-start gap-2.5",
        className
      )}
    >
      <HugeiconsIcon
        icon={isCountingDown ? HourglassIcon : AlertCircleIcon}
        className={cn(
          "size-4 text-danger shrink-0 mt-0.5",
          isCountingDown && "animate-pulse"
        )}
      />
      <div className="flex-1 space-y-1">
        <p className="leading-relaxed font-normal">{displayMessage}</p>
        {requestId && (
          <p className="text-[10px] font-mono text-danger/80">
            Reference: {requestId}
          </p>
        )}
      </div>
    </div>
  )
}

