import { useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { useAuth } from "../../auth"
import { ROUTES } from "../../../app/route-paths"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"

interface ShimmerCtaProps {
  className?: string
}

export function ShimmerCta({ className }: ShimmerCtaProps) {
  const { isAuthenticated } = useAuth()
  const prefersReduced = useReducedMotion()
  const [isShimmering, setIsShimmering] = useState(false)

  const route = isAuthenticated ? ROUTES.studio : ROUTES.register
  const label = isAuthenticated ? "Open your fitting room" : "Start your try-on"

  const triggerShimmer = () => {
    if (prefersReduced) return
    setIsShimmering(true)
  }

  return (
    <Link
      to={route}
      onMouseEnter={triggerShimmer}
      onFocus={triggerShimmer}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md",
        "bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-8 h-12 text-base shadow-sm",
        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        className
      )}
    >
      {/* Shimmer sweep overlay */}
      {!prefersReduced && (
        <span
          aria-hidden="true"
          onAnimationEnd={() => setIsShimmering(false)}
          className={cn(
            "pointer-events-none absolute inset-0 -translate-x-full z-0",
            "bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%)]",
            isShimmering && "animate-[shimmer_700ms_ease-in-out_forwards]"
          )}
        />
      )}

      {/* Button content */}
      <span className="relative z-10">{label}</span>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
      />
    </Link>
  )
}
