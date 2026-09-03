import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Folder01Icon } from "@hugeicons/core-free-icons"
import { cn } from "../../lib/utils"

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon = Folder01Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed border-zinc-800/80 rounded-xl bg-zinc-950/40 max-w-lg mx-auto",
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4">
        <HugeiconsIcon icon={icon} className="w-6 h-6" />
      </div>

      <h3 className="text-base font-medium text-zinc-200 mb-1 tracking-tight">{title}</h3>

      {description && (
        <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
