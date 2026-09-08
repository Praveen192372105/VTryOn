import React from "react"
import { motion } from "motion/react"
import { useReducedMotion } from "../../hooks/use-reduced-motion"
import { GridPattern } from "./grid-pattern"
import { BoxedGridPattern } from "./boxed-grid-pattern"
import { cn } from "../../lib/utils"

interface AuthBackgroundProps {
  children: React.ReactNode
  className?: string
}

export function AuthBackground({ children, className }: AuthBackgroundProps) {
  const prefersReduced = useReducedMotion()

  return (
    <div
      className={cn(
        "relative min-h-[100svh] w-full flex flex-col justify-between overflow-x-hidden bg-background text-foreground selection:bg-surface-raised selection:text-foreground",
        className
      )}
    >
      {/* Fixed Viewport-Stable Procedural Background Layers */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0"
      >
        {/* Layer 1 & 2: Full-Page Micro Grid */}
        <GridPattern size={32} className="opacity-40 text-foreground" />

        {/* Layer 3: Top-Right Macro Boxed Grid with Radial Fade */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 sm:w-80 sm:h-80 md:w-[420px] md:h-[420px] [mask-image:radial-gradient(ellipse_at_top_right,black_30%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_at_top_right,black_30%,transparent_75%)]">
          <motion.div
            className="w-full h-full opacity-80"
            initial={false}
            animate={prefersReduced ? {} : { y: [0, 6, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          >
            <BoxedGridPattern className="text-foreground" />
          </motion.div>
        </div>

        {/* Layer 4: Bottom-Left Macro Boxed Grid with Radial Fade */}
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 [mask-image:radial-gradient(ellipse_at_bottom_left,black_25%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_at_bottom_left,black_25%,transparent_75%)]">
          <motion.div
            className="w-full h-full opacity-50"
            initial={false}
            animate={prefersReduced ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          >
            <BoxedGridPattern className="text-foreground" />
          </motion.div>
        </div>

        {/* Layer 5: Soft Center Radial Highlight / Halo behind card */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,120,120,0.04),transparent_65%)]" />
      </div>

      {/* Layer 6: Content in document flow */}
      <div className="relative z-10 w-full min-h-[100svh] flex flex-col justify-between">
        {children}
      </div>
    </div>
  )
}
