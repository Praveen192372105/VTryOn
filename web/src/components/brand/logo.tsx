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
      <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-center text-white shadow-sm shrink-0">
        <LogoMark size={size} className="text-zinc-100" decorative={true} />
      </div>
      {showWordmark && (
        <div className="flex flex-col">
          <span className="text-base font-medium tracking-tight text-white leading-none">
            V Try-On
          </span>
          {showTagline && (
            <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono mt-1">
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
        className="hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-md"
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
  size = 24,
}: {
  className?: string
  size?: number | string
}) {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-center text-white shadow-sm shrink-0",
        className
      )}
    >
      <LogoMark size={size} className="text-zinc-100" decorative={true} />
    </div>
  )
}
