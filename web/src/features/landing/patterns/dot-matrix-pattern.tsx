import { cn } from "../../../lib/utils"

interface DotMatrixPatternProps {
  className?: string
}

export function DotMatrixPattern({ className }: DotMatrixPatternProps) {
  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full text-zinc-100", className)}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="dot-matrix"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="10" cy="10" r="1" fill="currentColor" fillOpacity="0.08" />
        </pattern>
      </defs>

      <rect width="320" height="320" fill="url(#dot-matrix)" />

      {/* Structural larger anchor nodes for visual hierarchy */}
      {[
        { cx: 80, cy: 80 },
        { cx: 160, cy: 80 },
        { cx: 240, cy: 80 },
        { cx: 80, cy: 160 },
        { cx: 160, cy: 160 },
        { cx: 240, cy: 160 },
        { cx: 80, cy: 240 },
        { cx: 160, cy: 240 },
        { cx: 240, cy: 240 },
      ].map((pt, i) => (
        <circle
          key={i}
          cx={pt.cx}
          cy={pt.cy}
          r="2"
          fill="currentColor"
          fillOpacity="0.18"
        />
      ))}
    </svg>
  )
}
