import React from "react"
import { useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

export interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

/**
 * Scoped page content transition for route changes.
 * A single short fade keeps content steady while the surrounding shell stays static.
 * If prefers-reduced-motion is active, animation is bypassed for immediate rendering.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation()
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={cn("w-full", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
