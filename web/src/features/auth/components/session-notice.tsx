import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { cn } from "../../../lib/utils"

export interface SessionNoticeProps {
  message?: string
  className?: string
}

export function SessionNotice({
  message = "Your session has expired. Please sign in again to continue.",
  className,
}: SessionNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5 text-sm text-amber-200",
        className
      )}
    >
      <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-amber-400 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}
