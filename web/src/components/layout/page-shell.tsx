import React from "react"
import { cn } from "../../lib/utils"

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  header?: React.ReactNode
}

export function PageShell({
  children,
  header,
  className,
  ...props
}: PageShellProps) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-200", className)} {...props}>
      {header && <div className="space-y-1">{header}</div>}
      {children}
    </div>
  )
}
