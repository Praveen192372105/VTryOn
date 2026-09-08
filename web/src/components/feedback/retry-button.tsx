import { HugeiconsIcon } from "@hugeicons/react"
import { ReloadIcon, Loading03Icon } from "@hugeicons/core-free-icons"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

export interface RetryButtonProps {
  onRetry: () => void
  isRetrying?: boolean
  label?: string
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function RetryButton({
  onRetry,
  isRetrying = false,
  label = "Try again",
  className,
  size = "sm",
  variant = "outline",
}: RetryButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onRetry}
      disabled={isRetrying}
      className={cn("gap-1.5", className)}
      aria-label={label}
    >
      <HugeiconsIcon
        icon={isRetrying ? Loading03Icon : ReloadIcon}
        size={14}
        className={cn("shrink-0", isRetrying && "animate-spin")}
      />
      <span>{label}</span>
    </Button>
  )
}
