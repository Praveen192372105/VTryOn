import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"

export function IdentityLockSvg() {
  const prefersReduced = useReducedMotion()

  return (
    <div
      role="img"
      aria-label="Layered architectural diagram showing locked facial and body identity markers with active garment transfer zone"
      className="relative w-full max-w-sm mx-auto aspect-[3/4] flex items-center justify-center select-none"
    >
      <svg
        viewBox="0 0 320 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-zinc-100"
      >
        {/* Background Coordinate Lines */}
        <g stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.1">
          <circle cx="160" cy="110" r="70" strokeDasharray="3 3" />
          <line x1="20" y1="110" x2="300" y2="110" />
          <line x1="160" y1="20" x2="160" y2="400" strokeDasharray="4 4" />
        </g>

        {/* 1. Preserved Identity Zone: Head & Face Anchor */}
        <g stroke="currentColor" strokeWidth="1.2">
          {/* Head silhouette */}
          <ellipse cx="160" cy="100" rx="26" ry="32" strokeOpacity="0.8" />
          {/* Preserved facial boundary marker */}
          <circle cx="160" cy="100" r="42" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3" />

          {/* Identity Protection Crosshairs */}
          <line x1="160" y1="85" x2="160" y2="115" strokeOpacity="0.4" />
          <line x1="145" y1="100" x2="175" y2="100" strokeOpacity="0.4" />

          <text
            x="215"
            y="95"
            fill="currentColor"
            fillOpacity="0.5"
            fontSize="8"
            fontFamily="monospace"
            letterSpacing="0.08em"
          >
            [IDENTITY_PRESERVED]
          </text>
        </g>

        {/* 2. Active Garment Synthesis Region */}
        <motion.path
          d="M 125 140 L 160 165 L 195 140 L 230 160 L 245 230 L 218 240 L 210 200 L 212 300 L 108 300 L 110 200 L 102 240 L 75 230 L 90 160 Z"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="1.5"
          initial={{ opacity: 0.7 }}
          animate={
            prefersReduced
              ? {}
              : {
                  opacity: [0.6, 1, 0.6],
                  strokeWidth: [1.2, 1.8, 1.2],
                }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Garment Transfer Darts & Seams */}
        <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.5">
          <path d="M 160 165 L 160 300" strokeDasharray="3 3" />
          <path d="M 135 190 L 160 210 L 185 190" />
        </g>

        <text
          x="160"
          y="235"
          textAnchor="middle"
          fill="currentColor"
          fillOpacity="0.6"
          fontSize="8"
          fontFamily="monospace"
          letterSpacing="0.08em"
        >
          // ACTIVE_TRANSFER_ZONE
        </text>

        {/* 3. Outer Locked Boundaries (Pose / Limbs) */}
        <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 4">
          {/* Left & Right Arm contours */}
          <path d="M 75 230 L 65 330" />
          <path d="M 245 230 L 255 330" />
          {/* Lower body contour */}
          <path d="M 120 300 L 115 390" />
          <path d="M 200 300 L 205 390" />
        </g>

        {/* Boundary Anchor Badges */}
        <g transform="translate(45, 370)">
          <rect width="230" height="22" rx="4" fill="#09090b" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
          <text
            x="115"
            y="14"
            textAnchor="middle"
            fill="currentColor"
            fillOpacity="0.5"
            fontSize="8"
            fontFamily="monospace"
          >
            BOUNDARY: POSE & FACIAL CUES RETAINED
          </text>
        </g>
      </svg>
    </div>
  )
}
