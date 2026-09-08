import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  Loading03Icon,
  Tick01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"

export function AsyncStatesSvg() {
  const prefersReduced = useReducedMotion()

  const states = [
    {
      id: "waiting",
      title: "Waiting to start",
      desc: "Job is registered in queue. System does not pretend work has started before hardware is allocated.",
      icon: Clock01Icon,
      badge: "QUEUED",
      activeBorder: "border-zinc-700",
      anim: "pulse",
    },
    {
      id: "creating",
      title: "Creating your look",
      desc: "Diffusion synthesis runs. Vector scanning occurs without fabricating artificial 47% percentages.",
      icon: Loading03Icon,
      badge: "PROCESSING",
      activeBorder: "border-zinc-500",
      anim: "scan",
    },
    {
      id: "ready",
      title: "Your look is ready",
      desc: "High-resolution output generated. Secure public URL returned with full before/after comparison.",
      icon: Tick01Icon,
      badge: "SUCCEEDED",
      activeBorder: "border-zinc-400",
      anim: "resolve",
    },
    {
      id: "failed",
      title: "Couldn't finish",
      desc: "Transparent failure reporting with request reference ID. No infinite stuck loading wheels.",
      icon: AlertCircleIcon,
      badge: "FAILED",
      activeBorder: "border-red-900/60",
      anim: "static",
    },
  ]

  return (
    <div
      role="img"
      aria-label="Four truthful async lifecycle states: Waiting to start, Creating your look, Your look is ready, and Couldn't finish"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full select-none"
    >
      {states.map((st) => (
        <div
          key={st.id}
          className={`relative rounded-xl border ${st.activeBorder} bg-zinc-950/60 p-5 flex flex-col justify-between space-y-4`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <HugeiconsIcon icon={st.icon} className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              {st.badge}
            </span>
          </div>

          {/* Micro Animation / Vector Visual */}
          <div className="h-16 flex items-center justify-center border-y border-zinc-900/80 my-2">
            {st.anim === "pulse" && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-ping" />
                <span className="text-xs font-mono text-zinc-400">awaiting worker...</span>
              </div>
            )}
            {st.anim === "scan" && (
              <div className="w-full px-4">
                <div className="relative h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                  {!prefersReduced && (
                    <motion.div
                      className="absolute top-0 bottom-0 w-1/3 bg-zinc-300 rounded-full"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
                <p className="text-[10px] font-mono text-zinc-500 text-center mt-2">
                  DIFFUSION_SYNTHESIS
                </p>
              </div>
            )}
            {st.anim === "resolve" && (
              <div className="flex items-center gap-2 text-zinc-200">
                <span className="text-xs font-mono text-emerald-400">100% COMPLETE</span>
              </div>
            )}
            {st.anim === "static" && (
              <div className="flex items-center gap-2 text-red-400">
                <span className="text-xs font-mono">ERROR_REPORTED</span>
              </div>
            )}
          </div>

          {/* Copy */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-zinc-200">{st.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{st.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
