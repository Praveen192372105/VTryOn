import { cn } from "../../lib/utils"

interface GridPatternProps {
  className?: string
  size?: number
}

export function GridPattern({ className, size = 32 }: GridPatternProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 pointer-events-none select-none",
        "bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]",
        className
      )}
      style={{
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  )
}
