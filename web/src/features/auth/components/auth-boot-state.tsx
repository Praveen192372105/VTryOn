import { Logo } from "../../../components/brand/Logo"
import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"

export interface AuthBootStateProps {
  className?: string
}

export function AuthBootState({ className }: AuthBootStateProps) {
  const reduced = useReducedMotion()
  return <div
    role="status"
    aria-label="Checking authentication session"
    className={cn("min-h-screen w-full flex flex-col items-center justify-center bg-[#f5f2ec] text-[#29251f] p-4", className)}
  >
    <div className="flex flex-col items-center gap-5">
      <div className="[&_.bg-primary]:bg-[#29251f] [&_.bg-primary]:border-[#29251f] [&_svg]:text-[#fffaf2] [&_.text-foreground]:text-[#29251f]">
        <Logo linkToHome={false} />
      </div>
      <span className="text-[11px] font-medium tracking-[0.16em] uppercase text-[#817970]">Preparing your fitting room</span>
      <div className="h-[2px] w-36 overflow-hidden bg-[#d9d0c5]" aria-hidden="true">
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
