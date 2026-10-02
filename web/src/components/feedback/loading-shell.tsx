import { motion } from "motion/react"
import { LogoMark } from "../brand/LogoMark"
import { useReducedMotion } from "../../hooks/use-reduced-motion"
import { cn } from "../../lib/utils"

export function LoadingShell({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  return <div
    className={cn("min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6", className)}
    role="status"
    aria-live="polite"
    aria-label="Loading V Try-On"
  >
    <div className="flex flex-col items-center text-center">
      <div className="size-14 rounded-lg bg-[#a77a57] text-[#fffaf2] flex items-center justify-center shadow-md">
        <LogoMark size={32} decorative />
      </div>
      <span className="mt-5 text-sm font-semibold tracking-tight">V Try-On</span>
      <span className="mt-1 text-xs text-muted-foreground">Preparing your fitting room</span>
      <div className="mt-6 h-[2px] w-36 overflow-hidden bg-border" aria-hidden="true">
        <motion.div
          className="h-full w-1/2 bg-[#a77a57]"
          initial={reduced ? false : { x: "-100%" }}
          animate={reduced ? { x: "50%" } : { x: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  </div>
}

export function SectionSkeleton({ className }: { className?: string }) {
  return <div className={cn("w-full space-y-4 animate-pulse p-6", className)}>
    <div className="h-8 w-48 bg-surface-subtle rounded-md" />
    <div className="h-4 w-72 max-w-full bg-surface-subtle rounded-md" />
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
      {Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[3/4] rounded-xl bg-surface-subtle border border-border" />)}
    </div>
  </div>
}
