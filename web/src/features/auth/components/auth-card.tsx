import * as React from "react"
import { cn } from "../../../lib/utils"

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  footer?: React.ReactNode
}

export function AuthCard({
  title,
  description,
  footer,
  children,
  className,
  ...props
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="mb-6 text-center space-y-1.5">
          {title && <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
      {footer && <div className="mt-6 pt-4 border-t border-border text-center">{footer}</div>}
    </div>
  )
}
