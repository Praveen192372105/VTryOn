import React, { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon } from "@hugeicons/core-free-icons"
import { cn } from "../../lib/utils"
import { useReducedMotion } from "../../hooks/use-reduced-motion"

export interface ImageFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt: string
  aspectRatio?: "3/4" | "4/5" | "1/1" | "16/9"
  objectFit?: "cover" | "contain"
  fallbackText?: string
  overlay?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  containerClassName?: string
}

export function ImageFrame({
  src,
  alt,
  aspectRatio = "3/4",
  objectFit = "cover",
  fallbackText = "Image unavailable",
  overlay,
  badge,
  actions,
  containerClassName,
  className,
  ...props
}: ImageFrameProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(!src)
  const prefersReducedMotion = useReducedMotion()

  const ratioClass = {
    "3/4": "aspect-[3/4]",
    "4/5": "aspect-[4/5]",
    "1/1": "aspect-square",
    "16/9": "aspect-video",
  }[aspectRatio]

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-zinc-900/60 border border-zinc-800/60 select-none",
        ratioClass,
        containerClassName
      )}
      {...props}
    >
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-zinc-800/40" aria-hidden="true" />
      )}

      {/* Error / Fallback State */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-zinc-500 bg-zinc-950/80">
          <HugeiconsIcon icon={Image01Icon} className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs font-mono tracking-wide uppercase">{fallbackText}</span>
        </div>
      ) : (
        /* Actual Image */
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          draggable={false}
          className={cn(
            "w-full h-full transition-opacity duration-500",
            objectFit === "cover" ? "object-cover" : "object-contain",
            isLoaded ? "opacity-100" : "opacity-0",
            prefersReducedMotion && "duration-0",
            className
          )}
        />
      )}

      {/* Top Badge Slot */}
      {badge && <div className="absolute top-3 left-3 z-10">{badge}</div>}

      {/* Action Buttons Slot */}
      {actions && <div className="absolute top-3 right-3 z-10 flex gap-1.5">{actions}</div>}

      {/* Custom Bottom/Hover Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 pointer-events-none">
          <div className="pointer-events-auto">{overlay}</div>
        </div>
      )}
    </div>
  )
}
