import { Link } from "react-router-dom"
import { LogoMark } from "./LogoMark"
import { ROUTES } from "../../app/route-paths"
import { cn } from "../../lib/utils"

export interface LogoProps {
  className?: string
  size?: number | string
  showWordmark?: boolean
  showTagline?: boolean
  linkToHome?: boolean
  title?: string
}

export function Logo({
  className,
  size = 28,
  showWordmark = true,
  showTagline = false,
  linkToHome = true,
  title = "V Try-On",
}: LogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground border border-border flex items-center justify-center shadow-xs shrink-0">
        <LogoMark size={size} className="text-primary-foreground" decorative={true} />
      </div>
      {showWordmark && (
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          <span className="text-base font-medium tracking-tight text-foreground leading-none">
            V Try-On
          </span>
          {showTagline && (
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono mt-1">
              Studio
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (linkToHome) {
    return (
      <Link
        to={ROUTES.home}
        className="hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        aria-label={`Return to ${title} home`}
      >
        {content}
      </Link>
    )
  }

  return content
}

// Re-export BrandMark for backward compatibility
export function BrandMark({
  className,
  size = 28,
}: {
  className?: string
  size?: number | string
}) {
  return <LogoMark className={className} size={size} />
}
