import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"

export interface GridNodeProps {
  x: string | number
  y: string | number
  size?: number
  pulse?: boolean
  duration?: number
  delay?: number
  className?: string
}

export function GridNode({
  x,
  y,
  size = 3,
  pulse = true,
  duration = 4,
  delay = 0,
  className,
}: GridNodeProps) {
  const prefersReduced = useReducedMotion()

  const left = typeof x === "number" ? `${x}%` : x
  const top = typeof y === "number" ? `${y}%` : y

  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute rounded-full bg-white pointer-events-none select-none", className)}
      style={{
        left,
        top,
        width: `${size}px`,
        height: `${size}px`,
        marginLeft: `-${size / 2}px`,
        marginTop: `-${size / 2}px`,
      }}
      initial={{ opacity: 0.4, scale: 1 }}
      animate={
        !prefersReduced && pulse
          ? {
              opacity: [0.35, 0.65, 0.35],
              scale: [1, 1.3, 1],
            }
          : { opacity: 0.45, scale: 1 }
      }
      transition={
        !prefersReduced && pulse
          ? {
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
    />
  )
}
