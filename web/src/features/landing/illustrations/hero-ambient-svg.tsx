import { cn } from "../../../lib/utils"

interface HeroAmbientSvgProps {
  className?: string
}

export function HeroAmbientSvg({ className }: HeroAmbientSvgProps) {
  return (
    <svg
      viewBox="0 0 800 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full text-zinc-100 pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      {/* Centered Horizon & Datum Line */}
      <line
        x1="100"
        y1="120"
        x2="700"
        y2="120"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeOpacity="0.08"
        strokeDasharray="4 6"
      />

      {/* Symmetrical Garment Drape Contours */}
      <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.07">
        <path d="M 280 40 C 340 90 370 120 400 120 C 430 120 460 90 520 40" />
        <path d="M 240 80 C 320 140 360 170 400 170 C 440 170 480 140 560 80" strokeOpacity="0.05" />
        <path d="M 200 130 C 300 190 350 210 400 210 C 450 210 500 190 600 130" strokeOpacity="0.03" />
      </g>

      {/* Center Alignment Reticle */}
      <circle cx="400" cy="120" r="28" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.10" />
      <circle cx="400" cy="120" r="2" fill="currentColor" fillOpacity="0.25" />
      <line x1="400" y1="84" x2="400" y2="156" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.12" />
      <line x1="364" y1="120" x2="436" y2="120" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.12" />

      {/* Flanking Coordinate Anchors */}
      <g stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.12">
        {/* Left anchor */}
        <path d="M 250 115 L 250 125 M 245 120 L 255 120" />
        <circle cx="250" cy="120" r="6" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.08" />

        {/* Right anchor */}
        <path d="M 550 115 L 550 125 M 545 120 L 555 120" />
        <circle cx="550" cy="120" r="6" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.08" />
      </g>

      {/* Faint Calibration Ticks */}
      {[300, 340, 380, 420, 460, 500].map((x) => (
        <line
          key={x}
          x1={x}
          y1="117"
          x2={x}
          y2="123"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.10"
        />
      ))}
    </svg>
  )
}
