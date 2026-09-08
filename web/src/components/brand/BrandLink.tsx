import { Link } from "react-router-dom"
import { BrandLockup } from "./BrandLockup"
import { cn } from "../../lib/utils"

export interface BrandLinkProps {
  to?: string
  className?: string
  size?: number
  layout?: "horizontal" | "vertical"
  showTagline?: boolean
  tagline?: string
  ariaLabel?: string
}

export function BrandLink({
  to = "/",
  className,
  size = 32,
  layout = "horizontal",
  showTagline = true,
  tagline = "Digital Fitting Room",
  ariaLabel = "V Try-On Home",
}: BrandLinkProps) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <BrandLockup
        size={size}
        layout={layout}
        showTagline={showTagline}
        tagline={tagline}
      />
    </Link>
  )
}
