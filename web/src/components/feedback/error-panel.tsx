import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, RefreshIcon } from "@hugeicons/core-free-icons"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface ErrorPanelProps {
  title?: string
  message: string
  requestId?: string
  onRetry?: () => void
  className?: string
}

export function ErrorPanel({
  title = "Unable to complete request",
  message,
  requestId,
  onRetry,
  className,
}: ErrorPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col p-6 rounded-xl border border-red-900/30 bg-red-950/20 text-zinc-200",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-red-900/20 text-red-400 border border-red-900/40 shrink-0 mt-0.5">
          <HugeiconsIcon icon={Alert02Icon} className="w-5 h-5" />
        </div>

        <div className="space-y-1 flex-1">
          <h4 className="text-sm font-medium text-zinc-200">{title}</h4>
          <p className="text-sm text-zinc-400 leading-relaxed">{message}</p>

          {requestId && (
            <p className="text-xs text-zinc-500 font-mono pt-1">
              Reference: <span className="select-all">{requestId}</span>
            </p>
          )}

          {onRetry && (
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1.5 border-zinc-800 hover:bg-zinc-900 text-zinc-300"
              >
                <HugeiconsIcon icon={RefreshIcon} className="w-3.5 h-3.5" />
                <span>Try again</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
