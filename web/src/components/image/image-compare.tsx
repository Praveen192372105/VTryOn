import React, { useState, useRef, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon } from "@hugeicons/core-free-icons"
import { cn } from "../../lib/utils"

export interface ImageCompareProps {
  originalSrc: string
  resultSrc: string
  originalAlt?: string
  resultAlt?: string
  aspectRatio?: "3/4" | "4/5" | "1/1"
  className?: string
}

export function ImageCompare({
  originalSrc,
  resultSrc,
  originalAlt = "Original portrait photo",
  resultAlt = "Generated try-on result",
  aspectRatio = "3/4",
  className,
}: ImageCompareProps) {
  const [position, setPosition] = useState(50) // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false)
  const [originalError, setOriginalError] = useState(false)
  const [resultError, setResultError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const ratioClass = {
    "3/4": "aspect-[3/4]",
    "4/5": "aspect-[4/5]",
    "1/1": "aspect-square",
  }[aspectRatio]

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(Math.round(percent))
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    updatePosition(e.clientX)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updatePosition(e.clientX)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore if already released
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault()
        setPosition((prev) => Math.max(0, prev - 5))
        break
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault()
        setPosition((prev) => Math.min(100, prev + 5))
        break
      case "Home":
        e.preventDefault()
        setPosition(0)
        break
      case "End":
        e.preventDefault()
        setPosition(100)
        break
    }
  }

  if (originalError || resultError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-surface-subtle border border-border flex flex-col items-center justify-center p-6 text-center text-muted-foreground",
          ratioClass,
          className
        )}
      >
        <HugeiconsIcon icon={Image01Icon} className="size-8 opacity-40 mb-2" />
        <p className="text-xs font-mono uppercase tracking-wider">Comparison unavailable</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      role="slider"
      aria-label="Comparison position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={position}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        "relative select-none overflow-hidden rounded-xl border border-border bg-surface-subtle cursor-ew-resize touch-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        ratioClass,
        className
      )}
    >
      {/* Background Layer: Generated Result */}
      <img
        src={resultSrc}
        alt={resultAlt}
        draggable={false}
        onError={() => setResultError(true)}
        className="absolute inset-0 size-full object-cover pointer-events-none"
      />

      {/* Foreground Layer: Original Portrait (GPU-clipped with inset) */}
      <div
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        className="absolute inset-0 size-full pointer-events-none"
      >
        <img
          src={originalSrc}
          alt={originalAlt}
          draggable={false}
          onError={() => setOriginalError(true)}
          className="absolute inset-0 size-full object-cover pointer-events-none"
        />
      </div>

      {/* Divider Line & Handle */}
      <div
        style={{ left: `${position}%` }}
        className="absolute inset-y-0 -ml-4 w-8 flex items-center justify-center pointer-events-none"
      >
        {/* Visual Line */}
        <div className="absolute inset-y-0 left-1/2 -ml-px w-0.5 bg-white/80 shadow-xs" />

        {/* Handle Knob */}
        <div className="size-7 rounded-full bg-white text-zinc-950 shadow-md border border-black/10 flex items-center justify-center text-[10px] font-bold tracking-tighter relative z-10">
          ↔
        </div>
      </div>

      {/* Badges */}
      <span className="absolute bottom-3 left-3 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono tracking-wider uppercase pointer-events-none">
        Original
      </span>
      <span className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono tracking-wider uppercase pointer-events-none">
        Try-On
      </span>
    </div>
  )
}
