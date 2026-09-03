import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"

export function FinalClosureSvg() {
  const prefersReduced = useReducedMotion()

  return (
    <div
      role="img"
      aria-label="Narrative vector diagram resolving person silhouette and garment outline into a finished fitted silhouette"
      className="w-full max-w-sm mx-auto aspect-[4/3] flex items-center justify-center select-none"
    >
      <svg
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-zinc-100"
      >
        {/* Fine background tailoring lines */}
        <g stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.1" strokeDasharray="3 4">
          <line x1="40" y1="120" x2="280" y2="120" />
          <line x1="160" y1="20" x2="160" y2="220" />
        </g>

        {/* Resolved Silhouette Composition */}
        <g stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.8">
          {/* Head & Neck */}
          <ellipse cx="160" cy="50" rx="16" ry="20" />
          <line x1="152" y1="69" x2="152" y2="80" />
          <line x1="168" y1="69" x2="168" y2="80" />

          {/* Fitted Garment Silhouette */}
          <motion.path
            d="M 135 84 L 160 102 L 185 84 L 212 100 L 222 150 L 202 155 L 198 125 L 200 210 L 120 210 L 122 125 L 118 155 L 98 150 L 108 100 Z"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeWidth="1.5"
            initial={{ opacity: 0.8 }}
            animate={
              prefersReduced
                ? {}
                : {
                    opacity: [0.8, 1, 0.8],
                  }
            }
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Garment center seam */}
          <line x1="160" y1="102" x2="160" y2="210" strokeDasharray="2 3" strokeOpacity="0.4" />
        </g>

        {/* Framing Corner Marks */}
        <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.4">
          <path d="M 60 40 L 40 40 L 40 60" />
          <path d="M 260 40 L 280 40 L 280 60" />
          <path d="M 60 200 L 40 200 L 40 180" />
          <path d="M 260 200 L 280 200 L 280 180" />
        </g>
      </svg>
    </div>
  )
}
