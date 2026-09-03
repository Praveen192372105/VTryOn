import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"

export function HeroTryonSvg() {
  const prefersReduced = useReducedMotion()

  return (
    <div
      role="img"
      aria-label="Abstract animated vector diagram demonstrating person silhouette aligning with a chosen garment"
      className="relative w-full max-w-lg mx-auto aspect-[4/5] flex items-center justify-center select-none"
    >
      <svg
        viewBox="0 0 400 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-zinc-100"
      >
        {/* Background Subtle Coordinate Grid */}
        <g stroke="currentColor" strokeOpacity="0.07" strokeWidth="1">
          <line x1="40" y1="40" x2="360" y2="40" />
          <line x1="40" y1="140" x2="360" y2="140" />
          <line x1="40" y1="260" x2="360" y2="260" />
          <line x1="40" y1="380" x2="360" y2="380" />
          <line x1="40" y1="460" x2="360" y2="460" />
          <line x1="40" y1="40" x2="40" y2="460" />
          <line x1="120" y1="40" x2="120" y2="460" />
          <line x1="200" y1="40" x2="200" y2="460" strokeDasharray="3 3" />
          <line x1="280" y1="40" x2="280" y2="460" />
          <line x1="360" y1="40" x2="360" y2="460" />
        </g>

        {/* Tailoring Measurement & Crop Marks */}
        <g stroke="currentColor" strokeOpacity="0.3" strokeWidth="1">
          {/* Top-left crop */}
          <path d="M 30 50 L 50 50 M 50 30 L 50 50" />
          {/* Top-right crop */}
          <path d="M 370 50 L 350 50 M 350 30 L 350 50" />
          {/* Bottom-left crop */}
          <path d="M 30 450 L 50 450 M 50 470 L 50 450" />
          {/* Bottom-right crop */}
          <path d="M 370 450 L 350 450 M 350 470 L 350 450" />
        </g>

        {/* Alignment Metadata Overlay */}
        <text
          x="60"
          y="68"
          fill="currentColor"
          fillOpacity="0.3"
          fontSize="9"
          fontFamily="monospace"
          letterSpacing="0.1em"
        >
          FIT_MATRIX // 768:1024
        </text>
        <text
          x="340"
          y="68"
          textAnchor="end"
          fill="currentColor"
          fillOpacity="0.3"
          fontSize="9"
          fontFamily="monospace"
        >
          ANAT_ALIGNED
        </text>

        {/* 1. Base Person Silhouette (Fine architectural line) */}
        <g stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" fill="none">
          {/* Head & Neck */}
          <ellipse cx="200" cy="110" rx="28" ry="34" />
          <path d="M 186 142 L 186 162 M 214 142 L 214 162" />

          {/* Shoulders and Arms contour */}
          <path d="M 186 162 C 160 166 125 182 110 230 L 98 340" strokeDasharray="4 4" />
          <path d="M 214 162 C 240 166 275 182 290 230 L 302 340" strokeDasharray="4 4" />

          {/* Torso & Hip anchor line */}
          <path d="M 148 230 L 140 370 L 175 460" strokeDasharray="2 4" />
          <path d="M 252 230 L 260 370 L 225 460" strokeDasharray="2 4" />
        </g>

        {/* 2. Selected Garment Blueprint (Outer dynamic garment outline) */}
        <motion.path
          d="M 165 166 L 200 195 L 235 166 L 275 186 L 290 270 L 260 278 L 255 230 L 256 360 L 144 360 L 145 230 L 140 278 L 110 270 L 125 186 Z"
          fill="currentColor"
          fillOpacity="0.04"
          stroke="currentColor"
          strokeWidth="1.5"
          initial={{ pathLength: prefersReduced ? 1 : 0.2, opacity: 0.7 }}
          animate={
            prefersReduced
              ? {}
              : {
                  pathLength: [0.7, 1, 0.7],
                  opacity: [0.7, 1, 0.7],
                }
          }
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Garment Drape & Lapel Accents */}
        <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.6">
          <path d="M 200 195 L 200 360" strokeDasharray="3 3" />
          <path d="M 175 220 L 200 240 L 225 220" />
          <path d="M 160 290 L 240 290" strokeDasharray="2 2" strokeOpacity="0.4" />
        </g>

        {/* 3. Synthesis Transformation Sweep */}
        {!prefersReduced && (
          <motion.line
            x1="100"
            y1="160"
            x2="300"
            y2="160"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeOpacity="0.8"
            animate={{
              y1: [160, 360, 160],
              y2: [160, 360, 160],
              opacity: [0.2, 0.9, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* 4. Coordinate Alignment Anchors */}
        {[
          { cx: 200, cy: 110, label: "HEAD_0" },
          { cx: 165, cy: 166, label: "SHOULDER_L" },
          { cx: 235, cy: 166, label: "SHOULDER_R" },
          { cx: 200, cy: 260, label: "CHEST_C" },
          { cx: 144, cy: 360, label: "HEM_L" },
          { cx: 256, cy: 360, label: "HEM_R" },
        ].map((node, i) => (
          <g key={i}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r="3"
              fill="currentColor"
              fillOpacity="0.8"
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r="7"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeOpacity="0.4"
            />
          </g>
        ))}

        {/* Bottom Status Tag */}
        <g transform="translate(130, 410)">
          <rect
            width="140"
            height="24"
            rx="12"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.2"
          />
          <text
            x="70"
            y="15"
            textAnchor="middle"
            fill="currentColor"
            fillOpacity="0.7"
            fontSize="9"
            fontFamily="monospace"
            letterSpacing="0.05em"
          >
            SYNTHESIS // READY
          </text>
        </g>
      </svg>
    </div>
  )
}
