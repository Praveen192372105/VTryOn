import { cn } from "../../lib/utils"

export interface WordmarkProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
  tagline?: string
}

export function Wordmark({
  className,
  size = "md",
  showTagline = false,
  tagline = "Digital Fitting Room",
}: WordmarkProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base font-medium",
    lg: "text-xl font-semibold tracking-tight",
  }[size]

  return (
    <div className={cn("inline-flex flex-col select-none", className)}>
      <span className={cn("tracking-tight text-foreground leading-none", sizeClasses)}>
        V Try-On
      </span>
      {showTagline && (
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono mt-1">
          {tagline}
        </span>
      )}
    </div>
  )
}
