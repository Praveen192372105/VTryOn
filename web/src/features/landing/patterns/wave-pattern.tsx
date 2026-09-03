import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"

interface WavePatternProps {
  className?: string
}

export function WavePattern({ className }: WavePatternProps) {
  const prefersReduced = useReducedMotion()

  return (
    <svg
      viewBox="0 0 500 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full text-zinc-100", className)}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1">
        {/* Drape contour 1: elevated to 0.14 */}
        <motion.path
          d="M -20 220 C 120 180 220 280 340 210 C 420 160 480 230 520 190"
          strokeOpacity="0.14"
          initial={false}
          animate={prefersReduced ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Drape contour 2: elevated to 0.18 */}
        <motion.path
          d="M -30 250 C 100 200 240 310 360 230 C 440 180 490 250 530 210"
          strokeOpacity="0.18"
          initial={false}
          animate={prefersReduced ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Drape contour 3: elevated to 0.10 */}
        <motion.path
          d="M -40 280 C 80 220 250 330 380 250 C 460 200 500 270 540 230"
          strokeOpacity="0.10"
          initial={false}
          animate={prefersReduced ? {} : { y: [0, -8, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Topographic fold accent: elevated to 0.22 */}
        <path
          d="M 50 240 C 160 210 260 290 370 230"
          strokeDasharray="3 4"
          strokeOpacity="0.22"
        />
      </g>
    </svg>
  )
}
