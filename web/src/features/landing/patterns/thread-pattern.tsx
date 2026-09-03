import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"

interface ThreadPatternProps {
  className?: string
}

export function ThreadPattern({ className }: ThreadPatternProps) {
  const prefersReduced = useReducedMotion()

  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full text-zinc-100", className)}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1">
        {/* Continuous fashion-thread path with loop: elevated to 0.18 */}
        <motion.path
          d="M -20 180 C 80 120 160 260 220 180 C 260 120 280 80 300 120 C 315 150 285 170 270 140 C 255 110 320 60 420 100"
          strokeOpacity="0.18"
          initial={false}
          animate={
            prefersReduced
              ? {}
              : {
                  pathOffset: [0, 1],
                }
          }
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        />

        {/* Supporting parallel basting stitch: elevated to 0.14 */}
        <path
          d="M 10 210 C 100 155 180 285 240 210 C 280 155 330 110 410 130"
          strokeDasharray="4 6"
          strokeOpacity="0.14"
        />
      </g>

      {/* Origin & termination eyelet nodes: elevated to 0.40 */}
      <circle cx="220" cy="180" r="3" fill="currentColor" fillOpacity="0.40" />
      <circle cx="300" cy="120" r="2.5" fill="currentColor" fillOpacity="0.35" />
    </svg>
  )
}
