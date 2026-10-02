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
        "flex flex-col p-6 rounded-xl border border-danger/25 bg-danger-subtle text-foreground",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-danger/10 text-danger border border-danger/25 shrink-0 mt-0.5">
          <HugeiconsIcon icon={Alert02Icon} className="w-5 h-5" />
        </div>

        <div className="space-y-1 flex-1">
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>

          {requestId && (
            <p className="text-xs text-muted-foreground font-mono pt-1">
              Reference: <span className="select-all">{requestId}</span>
            </p>
          )}

          {onRetry && (
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1.5 border-danger/30 hover:bg-danger/10 text-danger"
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
