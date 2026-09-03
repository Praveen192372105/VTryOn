import { cn } from "../../../lib/utils"

interface TailoringGridPatternProps {
  className?: string
}

export function TailoringGridPattern({ className }: TailoringGridPatternProps) {
  return (
    <svg
      viewBox="0 0 360 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full text-zinc-100", className)}
      aria-hidden="true"
    >
      {/* Corner Crop Brackets: elevated to 0.35 */}
      <g stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35">
        <path d="M 30 50 L 50 50 M 50 30 L 50 50" />
        <path d="M 330 50 L 310 50 M 310 30 L 310 50" />
        <path d="M 30 310 L 50 310 M 50 330 L 50 310" />
        <path d="M 330 310 L 310 310 M 310 330 L 310 310" />
      </g>

      {/* Calibration Tick Line (Vertical Rule): elevated to 0.18 */}
      <g stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.18">
        <line x1="50" y1="60" x2="50" y2="300" />
        {/* Regular calibration ticks */}
        {[80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280].map((y) => (
          <line
            key={y}
            x1="46"
            y1={y}
            x2={y % 40 === 0 ? "58" : "53"}
            y2={y}
          />
        ))}
      </g>

      {/* Calibration Tick Line (Horizontal Rule): elevated to 0.18 */}
      <g stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.18">
        <line x1="60" y1="50" x2="300" y2="50" />
        {[80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280].map((x) => (
          <line
            key={x}
            x1={x}
            y1="46"
            x2={x}
            y2={x % 40 === 0 ? "58" : "53"}
          />
        ))}
      </g>

      {/* Construction Darts and Crosshairs: elevated to 0.16 */}
      <g stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.16" strokeDasharray="3 4">
        <line x1="180" y1="60" x2="180" y2="300" />
        <line x1="60" y1="180" x2="300" y2="180" />
      </g>

      {/* Center Precision Reticle: elevated to 0.30 / 0.45 */}
      <circle cx="180" cy="180" r="16" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.30" />
      <circle cx="180" cy="180" r="2.5" fill="currentColor" fillOpacity="0.45" />
    </svg>
  )
}
