import { GridFlowLine, type GridFlowLineProps } from "./grid-flow-line"
import { GridNode, type GridNodeProps } from "./grid-node"
import { cn } from "../../../lib/utils"

export interface FlowGridPatternProps {
  flowLines?: GridFlowLineProps[]
  nodes?: GridNodeProps[]
  density?: "default" | "dense" | "sparse"
  className?: string
  showCenterMask?: boolean
}

export function FlowGridPattern({
  flowLines = [],
  nodes = [],
  density = "default",
  className,
  showCenterMask = true,
}: FlowGridPatternProps) {
  const microSize = density === "dense" ? 20 : density === "sparse" ? 40 : 28

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 pointer-events-none select-none overflow-hidden",
        className
      )}
    >
      {/* 1. Repeating Micro-Grid (6-8% opacity) */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)]"
        style={{
          backgroundSize: `${microSize}px ${microSize}px`,
        }}
      />

      {/* 2. Major Structural Grid (14-16% opacity) with broken segments */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)]"
        style={{
          backgroundSize: `${microSize * 5}px ${microSize * 5}px`,
        }}
      />

      {/* 3. Center Content Readability Mask */}
      {showCenterMask && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.85)_15%,rgba(0,0,0,0.4)_55%,transparent_85%)] pointer-events-none" />
      )}

      {/* 4. Directional Traveling Indicator Lines */}
      {flowLines.map((line, idx) => (
        <GridFlowLine
          key={`flow-line-${idx}`}
          axis={line.axis}
          direction={line.direction}
          position={line.position}
          duration={line.duration}
          delay={line.delay}
          trackOpacity={line.trackOpacity ?? 0.12}
        />
      ))}

      {/* 5. Active Intersection Nodes */}
      {nodes.map((node, idx) => (
        <GridNode
          key={`flow-node-${idx}`}
          x={node.x}
          y={node.y}
          size={node.size}
          pulse={node.pulse}
          duration={node.duration}
          delay={node.delay}
        />
      ))}
    </div>
  )
}
