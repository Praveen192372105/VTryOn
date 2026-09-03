import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { cn } from "../../../lib/utils"

interface AuthFormErrorProps {
  message?: string | null
  requestId?: string | null
  className?: string
}

export function AuthFormError({ message, requestId, className }: AuthFormErrorProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-300 space-y-1.5 flex items-start gap-2.5",
        className
      )}
    >
      <HugeiconsIcon
        icon={AlertCircleIcon}
        className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
      />
      <div className="flex-1 space-y-1">
        <p className="leading-relaxed font-normal">{message}</p>
        {requestId && (
          <p className="text-[10px] font-mono text-red-400/80">
            Reference: {requestId}
          </p>
        )}
      </div>
    </div>
  )
}
