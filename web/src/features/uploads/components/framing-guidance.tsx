import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ViewIcon, ViewOffIcon, InformationCircleIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import type { DecodedImageMetadata } from "../types"

export interface FramingGuidanceProps {
  metadata?: DecodedImageMetadata | null
  fileSizeFormatted?: string
  fileName?: string
  className?: string
}

export function FramingGuidance({
  metadata,
  fileSizeFormatted,
  fileName,
  className,
}: FramingGuidanceProps) {
  const [showGuides, setShowGuides] = useState(true)

  return (
    <div className={cn("relative w-full h-full pointer-events-none", className)}>
      {/* Visual Non-Destructive Framing Overlay */}
      {showGuides && (
        <div
          data-testid="framing-overlay"
          className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none select-none transition-opacity duration-200"
          aria-hidden="true"
        >
          {/* Top Corner Brackets */}
          <div className="flex justify-between items-start">
            <div className="size-4 border-t-2 border-l-2 border-foreground/30 rounded-tl-sm" />
            <div className="size-4 border-t-2 border-r-2 border-foreground/30 rounded-tr-sm" />
          </div>

          {/* Center Safe Framing Box & Vertical Axis */}
          <div className="absolute inset-x-8 inset-y-12 border border-dashed border-foreground/25 rounded-2xl flex items-center justify-center pointer-events-none">
            {/* Center Vertical Axis */}
            <div className="absolute inset-y-0 w-px bg-foreground/15" />
            {/* Head / Torso Breathing Room Indicator */}
            <div className="absolute top-4 w-28 h-24 border border-foreground/20 rounded-full" />
          </div>

          {/* Bottom Corner Brackets */}
          <div className="flex justify-between items-end">
            <div className="size-4 border-b-2 border-l-2 border-foreground/30 rounded-bl-sm" />
            <div className="size-4 border-b-2 border-r-2 border-foreground/30 rounded-br-sm" />
          </div>
        </div>
      )}

      {/* Floating Guidance Controls & Quiet Metadata */}
      <div className="absolute top-3 right-3 pointer-events-auto z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowGuides((prev) => !prev)}
          className="px-2.5 py-1 text-xs font-medium rounded-full bg-background/80 hover:bg-background text-foreground border border-border/70 backdrop-blur-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer select-none"
          title={showGuides ? "Hide framing guides" : "Show framing guides"}
          aria-label={showGuides ? "Hide framing guides" : "Show framing guides"}
        >
          <HugeiconsIcon icon={showGuides ? ViewOffIcon : ViewIcon} className="size-3.5" />
          <span className="hidden sm:inline">{showGuides ? "Hide guides" : "Show guides"}</span>
        </button>
      </div>

      {/* Quiet Technical Metadata Pill in Bottom Left */}
      {(metadata || fileSizeFormatted || fileName) && (
        <div className="absolute bottom-3 left-3 pointer-events-auto z-30">
          <div
            title={fileName || undefined}
            className="px-2.5 py-1 rounded-full bg-background/80 border border-border/70 backdrop-blur-md text-[11px] font-mono text-muted-foreground shadow-xs flex items-center gap-2"
          >
            {metadata && (
              <span>
                {metadata.width}×{metadata.height}
              </span>
            )}
            {fileSizeFormatted && (
              <>
                <span className="opacity-40">·</span>
                <span>{fileSizeFormatted}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Editorial Framing Guidance Tips Card
 */
export function FramingTipsCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-surface-subtle p-3.5 text-xs text-muted-foreground space-y-2",
        className
      )}
    >
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-muted-foreground shrink-0" />
        <span>Tips for best try-on results</span>
      </div>
      <ul className="space-y-1 list-disc list-inside text-[11px] text-muted-foreground leading-relaxed pl-1">
        <li>Portrait or full-body framing is preferred.</li>
        <li>Keep the person clearly visible with good lighting.</li>
        <li>Avoid heavy obstructions or extreme angles.</li>
      </ul>
    </div>
  )
}
