import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"

export function FlowDiagramSvg() {
  const prefersReduced = useReducedMotion()

  const steps = [
    { x: 70, label: "01 / PORTRAIT", sub: "User Silhouette" },
    { x: 230, label: "02 / GARMENT", sub: "Selected Look" },
    { x: 390, label: "03 / DISPATCH", sub: "Async Job Queue" },
    { x: 550, label: "04 / SYNTHESIS", sub: "Diffusion Transfer" },
    { x: 710, label: "05 / RESULT", sub: "Verified Render" },
  ]

  return (
    <div
      role="img"
      aria-label="Connected system flow showing the sequential stages from image upload to verified synthesis"
      className="w-full overflow-hidden select-none py-6"
    >
      <svg
        viewBox="0 0 800 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto text-zinc-100"
      >
        {/* Continuous Pipeline Spine Line */}
        <line
          x1="70"
          y1="50"
          x2="710"
          y2="50"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.2"
        />

        {/* Animated Active Pipeline Pulse */}
        {!prefersReduced && (
          <motion.line
            x1="70"
            y1="50"
            x2="710"
            y2="50"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="20 180"
            strokeLinecap="round"
            animate={{
              strokeDashoffset: [0, -400],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}

        {/* Pipeline Nodes */}
        {steps.map((step, idx) => (
          <g key={idx} transform={`translate(${step.x}, 50)`}>
            {/* Outer halo */}
            <circle
              r="16"
              fill="#09090b"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
            {/* Center dot */}
            <circle
              r="5"
              fill="currentColor"
              fillOpacity={idx === 4 ? "1" : "0.7"}
            />
            {/* Step text */}
            <text
              y="32"
              textAnchor="middle"
              fill="currentColor"
              fillOpacity="0.8"
              fontSize="9"
              fontFamily="monospace"
              letterSpacing="0.08em"
            >
              {step.label}
            </text>
            <text
              y="44"
              textAnchor="middle"
              fill="currentColor"
              fillOpacity="0.4"
              fontSize="8"
              fontFamily="system-ui, sans-serif"
            >
              {step.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
