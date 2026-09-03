import { useRef } from "react"
import { useInView } from "motion/react"
import { PATTERN_PRESETS, type LandingPatternPreset } from "./pattern-presets"
import { FlowGridPattern } from "./flow-grid-pattern"
import { PatternField } from "./pattern-field"
import { GridFlowLine } from "./grid-flow-line"
import { cn } from "../../../lib/utils"

interface SectionPatternProps {
  preset: LandingPatternPreset
  className?: string
}

export function SectionPattern({ preset, className }: SectionPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { margin: "200px" })
  const config = PATTERN_PRESETS[preset]

  if (!config) return null

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "absolute inset-0 pointer-events-none select-none overflow-hidden z-0",
        className
      )}
    >
      {/* 1. Full-Background Grid Field (if configured) */}
      {config.fullGrid && isInView && (
        <FlowGridPattern
          density={config.fullGrid.density}
          flowLines={config.fullGrid.flowLines}
          nodes={config.fullGrid.nodes}
          showCenterMask={config.fullGrid.showCenterMask}
        />
      )}

      {/* 2. Art-Directed Corner Pattern Fragments */}
      {config.corners && (
        <div className="absolute inset-0 pointer-events-none">
          {config.corners.map((corner, idx) => (
            <PatternField
              key={`corner-${idx}`}
              variant={corner.variant}
              position={corner.position}
              intensity="strong"
              className={corner.className}
            />
          ))}
        </div>
      )}

      {/* 3. Extra Directional Flow Lines */}
      {config.extraFlowLines && isInView && (
        <div className="absolute inset-0 pointer-events-none">
          {config.extraFlowLines.map((line, idx) => (
            <GridFlowLine
              key={`extra-flow-${idx}`}
              axis={line.axis}
              direction={line.direction}
              position={line.position}
              duration={line.duration}
              delay={line.delay}
            />
          ))}
        </div>
      )}
    </div>
  )
}
