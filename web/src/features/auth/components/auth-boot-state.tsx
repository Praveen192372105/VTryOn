import { LogoMark } from "@/components/brand/LogoMark"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

export interface AuthBootStateProps {
  className?: string
}

export function AuthBootState({ className }: AuthBootStateProps) {
  const prefersReduced = useReducedMotion()

  return (
    <div
      role="status"
      aria-label="Checking authentication session"
      className={cn(
        "min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground select-none p-4",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Brand Mark */}
        <div className="size-11 rounded-xl bg-surface border border-border flex items-center justify-center shadow-xs">
          <LogoMark size={22} className="text-foreground" decorative={true} />
        </div>

        {/* Quiet Spinner */}
        <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-muted-foreground">
          <svg
            className={cn("size-3.5 text-muted-foreground", !prefersReduced && "animate-spin")}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Authenticating</span>
        </div>
      </div>
    </div>
  )
}
