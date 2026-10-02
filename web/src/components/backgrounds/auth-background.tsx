import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

interface AuthBackgroundProps {
  children: ReactNode
  className?: string
}

export function AuthBackground({ children, className }: AuthBackgroundProps) {
  return <div className={cn("auth-shell", className)}>
    <div className="auth-shell-backdrop fixed inset-0 pointer-events-none" aria-hidden="true" />
    <div className="auth-shell-content">{children}</div>
  </div>
}
