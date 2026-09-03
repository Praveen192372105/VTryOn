import { cn } from "../../lib/utils"

interface BoxedGridPatternProps {
  className?: string
}

export function BoxedGridPattern({ className }: BoxedGridPatternProps) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full text-zinc-100", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* 20px micro grid pattern */}
        <pattern
          id="auth-boxed-micro-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeOpacity="0.04"
          />
        </pattern>
      </defs>

      {/* Fill with micro-grid */}
      <rect width="400" height="400" fill="url(#auth-boxed-micro-grid)" />

      {/* Macro 100px structural lines with broken segments */}
      <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.10">
        {/* Horizontal structural lines */}
        <line x1="0" y1="100" x2="320" y2="100" />
        <line x1="360" y1="100" x2="400" y2="100" />
        <line x1="40" y1="200" x2="260" y2="200" />
        <line x1="300" y1="200" x2="400" y2="200" />
        <line x1="0" y1="300" x2="380" y2="300" />

        {/* Vertical structural lines */}
        <line x1="100" y1="0" x2="100" y2="240" />
        <line x1="100" y1="280" x2="100" y2="400" />
        <line x1="200" y1="40" x2="200" y2="360" />
        <line x1="300" y1="0" x2="300" y2="180" />
        <line x1="300" y1="220" x2="300" y2="400" />
      </g>

      {/* Selected highlighted accent cells */}
      <rect
        x="100"
        y="100"
        width="100"
        height="100"
        fill="currentColor"
        fillOpacity="0.02"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.14"
      />
      <rect
        x="240"
        y="40"
        width="40"
        height="40"
        fill="currentColor"
        fillOpacity="0.03"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeOpacity="0.12"
      />
      <rect
        x="60"
        y="260"
        width="40"
        height="40"
        fill="currentColor"
        fillOpacity="0.02"
      />

      {/* Subtle intersection marks */}
      <circle cx="100" cy="100" r="2.5" fill="currentColor" fillOpacity="0.2" />
      <circle cx="200" cy="200" r="2.5" fill="currentColor" fillOpacity="0.2" />
      <circle cx="300" cy="100" r="2.5" fill="currentColor" fillOpacity="0.16" />
    </svg>
  )
}
