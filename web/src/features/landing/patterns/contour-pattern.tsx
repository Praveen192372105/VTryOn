import { cn } from "../../../lib/utils"

interface ContourPatternProps {
  className?: string
}

export function ContourPattern({ className }: ContourPatternProps) {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full text-zinc-100", className)}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1">
        {/* Nested topographic drape contours: elevated to 0.14 - 0.18 */}
        <path d="M 40 280 C 100 240 180 260 260 210 C 320 170 360 190 410 160" strokeOpacity="0.14" />
        <path d="M 60 300 C 120 255 190 275 270 225 C 330 185 370 205 420 175" strokeOpacity="0.18" />
        <path d="M 20 260 C 80 225 170 245 250 195 C 310 155 350 175 400 145" strokeOpacity="0.10" />
        <path d="M 80 320 C 140 270 200 290 280 240 C 340 200 380 220 430 190" strokeOpacity="0.08" />
      </g>
    </svg>
  )
}
