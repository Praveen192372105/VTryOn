import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Folder01Icon } from "@hugeicons/core-free-icons"
import { cn } from "../../lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon = Folder01Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed border-border/80 rounded-2xl bg-surface-subtle/50 max-w-lg mx-auto",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center size-11 rounded-full bg-surface border border-border text-muted-foreground mb-4 shadow-2xs">
        <HugeiconsIcon icon={icon} className="size-5 shrink-0" />
      </div>

      <h3 className="text-sm sm:text-base font-medium text-foreground mb-1 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
