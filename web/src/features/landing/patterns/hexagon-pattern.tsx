import { cn } from "../../../lib/utils"

interface HexagonPatternProps {
  className?: string
}

export function HexagonPattern({ className }: HexagonPatternProps) {
  return (
    <svg
      viewBox="0 0 360 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full text-zinc-100", className)}
      aria-hidden="true"
    >
      <defs>
        {/* Hexagonal unit cell: elevated to 0.12 stroke */}
        <pattern
          id="hex-grid"
          width="60"
          height="104"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 30 0 L 60 17.32 L 60 51.96 L 30 69.28 L 0 51.96 L 0 17.32 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.12"
          />
          <path
            d="M 30 52 L 60 69.32 L 60 103.96 L 30 121.28 L 0 103.96 L 0 69.32 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.12"
          />
        </pattern>
      </defs>

      {/* Hexagonal mesh layer */}
      <rect width="360" height="360" fill="url(#hex-grid)" />

      {/* Structural accent hexagons: elevated to 0.22 stroke */}
      <polygon
        points="180,60 210,77.3 210,112 180,129.3 150,112 150,77.3"
        fill="currentColor"
        fillOpacity="0.05"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeOpacity="0.22"
      />
      <polygon
        points="240,164 270,181.3 270,216 240,233.3 210,216 210,181.3"
        fill="currentColor"
        fillOpacity="0.04"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.18"
      />

      {/* Subtle coordinate nodes at intersections: elevated to 0.45 */}
      <circle cx="180" cy="60" r="2.5" fill="currentColor" fillOpacity="0.45" />
      <circle cx="210" cy="77.3" r="2.5" fill="currentColor" fillOpacity="0.45" />
      <circle cx="150" cy="77.3" r="2.5" fill="currentColor" fillOpacity="0.45" />
      <circle cx="240" cy="164" r="2.5" fill="currentColor" fillOpacity="0.40" />
    </svg>
  )
}
