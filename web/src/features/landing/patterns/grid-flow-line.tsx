import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"

export interface GridFlowLineProps {
  axis?: "horizontal" | "vertical"
  direction?: "forward" | "reverse"
  position: string | number
  duration?: number
  delay?: number
  className?: string
  trackOpacity?: number
}

export function GridFlowLine({
  axis = "horizontal",
  direction = "forward",
  position,
  duration = 8,
  delay = 0,
  className,
  trackOpacity = 0.08,
}: GridFlowLineProps) {
  const prefersReduced = useReducedMotion()

  const posStyle = typeof position === "number" ? `${position}%` : position

  if (axis === "horizontal") {
    const isForward = direction === "forward"

    return (
      <div
        aria-hidden="true"
        className={cn("absolute left-0 right-0 pointer-events-none select-none overflow-hidden", className)}
        style={{ top: posStyle, height: "20px", marginTop: "-10px" }}
      >
        {/* Static Base Grid Track */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white"
          style={{ opacity: trackOpacity }}
        />

        {/* Animated Traveling Indicator */}
        {!prefersReduced && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-48 sm:w-64 h-full"
            initial={{ x: isForward ? "-200px" : "calc(100% + 200px)" }}
            animate={{
              x: isForward
                ? ["-200px", "calc(100% + 200px)"]
                : ["calc(100% + 200px)", "-200px"],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* Linear Gradient Faded Lead & Trail */}
            <div className="w-full h-[1.5px] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_20%,rgba(255,255,255,0.45)_50%,rgba(255,255,255,0.08)_80%,transparent_100%)]" />
            {/* Bright Active Core Node */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
          </motion.div>
        )}
      </div>
    )
  }

  // Vertical Flow Line
  const isForward = direction === "forward"

  return (
    <div
      aria-hidden="true"
      className={cn("absolute top-0 bottom-0 pointer-events-none select-none overflow-hidden", className)}
      style={{ left: posStyle, width: "20px", marginLeft: "-10px" }}
    >
      {/* Static Base Grid Track */}
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-white"
        style={{ opacity: trackOpacity }}
      />

      {/* Animated Traveling Indicator */}
      {!prefersReduced && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center h-48 sm:h-64 w-full"
          initial={{ y: isForward ? "-200px" : "calc(100% + 200px)" }}
          animate={{
            y: isForward
              ? ["-200px", "calc(100% + 200px)"]
              : ["calc(100% + 200px)", "-200px"],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Linear Gradient Faded Lead & Trail */}
          <div className="h-full w-[1.5px] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.08)_20%,rgba(255,255,255,0.45)_50%,rgba(255,255,255,0.08)_80%,transparent_100%)]" />
          {/* Bright Active Core Node */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
        </motion.div>
      )}
    </div>
  )
}
