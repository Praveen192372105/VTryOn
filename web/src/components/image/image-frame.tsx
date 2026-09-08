import React, { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { cn } from "../../lib/utils"
import { useReducedMotion } from "../../hooks/use-reduced-motion"

export interface ImageFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt: string
  aspectRatio?: "3/4" | "4/5" | "1/1" | "16/9" | "auto"
  objectFit?: "cover" | "contain"
  fallbackText?: string
  overlay?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  selected?: boolean
  containerClassName?: string
  hasError?: boolean
  isLoading?: boolean
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
  selected = false,
  containerClassName,
  className,
  hasError: externalHasError,
  isLoading = false,
  ...props
}: ImageFrameProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [internalHasError, setInternalHasError] = useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)
  const prefersReducedMotion = useReducedMotion()

  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true)
      setInternalHasError(false)
    } else {
      setIsLoaded(false)
      setInternalHasError(false)
    }
  }, [src])

  const hasError = externalHasError || internalHasError
  const showSkeleton = (!isLoaded || !src || isLoading) && !hasError

  const ratioClass = {
    "3/4": "aspect-[3/4]",
    "4/5": "aspect-[4/5]",
    "1/1": "aspect-square",
    "16/9": "aspect-video",
    auto: "",
  }[aspectRatio]

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-surface-subtle border border-border/80 select-none transition-all duration-200 w-full",
        selected && "ring-2 ring-primary border-transparent shadow-sm",
        ratioClass,
        containerClassName
      )}
      {...props}
    >
      {/* Loading Skeleton */}
      {showSkeleton && (
        <div
          className={cn(
            "absolute inset-0 bg-muted/40",
            !prefersReducedMotion && "animate-pulse"
          )}
          aria-hidden="true"
        />
      )}

      {/* Error / Fallback State */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-muted-foreground bg-surface-subtle">
          <HugeiconsIcon icon={Image01Icon} className="w-8 h-8 mb-2 opacity-50 shrink-0" />
          <span className="text-xs font-mono tracking-wide uppercase">{fallbackText}</span>
        </div>
      ) : src ? (
        /* Actual Image */
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => {
            setIsLoaded(true)
            setInternalHasError(false)
          }}
          onError={() => setInternalHasError(true)}
          draggable={false}
          className={cn(
            "w-full h-full transition-opacity duration-300",
            objectFit === "cover" ? "object-cover" : "object-contain",
            isLoaded ? "opacity-100" : "opacity-0",
            prefersReducedMotion && "duration-0",
            className
          )}
        />
      ) : null}

      {/* Selected Indicator Badge */}
      {selected && (
        <div className="absolute top-2.5 left-2.5 z-20 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2.5} className="size-3.5" />
        </div>
      )}

      {/* Top Custom Badge Slot */}
      {badge && !selected && (
        <div className="absolute top-3 left-3 z-10">{badge}</div>
      )}

      {/* Action Buttons Slot */}
      {actions && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">{actions}</div>
      )}

      {/* Bottom Overlay Slot */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex flex-col justify-end p-4 pointer-events-none">
          <div className="pointer-events-auto">{overlay}</div>
        </div>
      )}
    </div>
  )
}
