import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp02Icon } from "@hugeicons/core-free-icons"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"

export function PageProgressController() {
  const prefersReduced = useReducedMotion()
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let ticking = false

    const updateScrollProgress = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight

      if (docHeight > 0) {
        const rawProgress = Math.min(Math.max(scrollY / docHeight, 0), 1)
        setProgress(rawProgress)
      } else {
        setProgress(0)
      }

      setIsVisible(scrollY > 250)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    updateScrollProgress()

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "auto" : "smooth",
    })
  }

  // Circular progress ring geometry: r = 16, circumference = 2 * PI * 16 ≈ 100.53
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  const percentage = Math.round(progress * 100)

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300 ease-out",
        "right-3.5 bottom-3.5 sm:right-6 sm:bottom-6 md:right-8 md:bottom-8",
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      )}
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
      }}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={cn(
          "group relative flex items-center rounded-full transition-all duration-200",
          "bg-zinc-950/90 border border-zinc-800/80 text-zinc-300 shadow-md backdrop-blur-md",
          "hover:border-zinc-700 hover:text-white hover:bg-zinc-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "h-11 w-11 sm:w-auto p-0 sm:pl-1 sm:pr-3 justify-center sm:justify-start"
        )}
      >
        {/* Dedicated Ring + Arrow Container: Always 38x38px so the ring cleanly wraps the arrow */}
        <div className="relative flex items-center justify-center w-[38px] h-[38px] shrink-0">
          <svg
            width="38"
            height="38"
            viewBox="0 0 38 38"
            className="absolute inset-0 -rotate-90 pointer-events-none"
            aria-hidden="true"
          >
            {/* Background circle track: 1.25px fine stroke */}
            <circle
              cx="19"
              cy="19"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              className="text-zinc-800/90"
            />
            {/* Active progress stroke: 1.75px refined stroke */}
            <circle
              cx="19"
              cy="19"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-zinc-200 transition-[stroke-dashoffset] duration-150 ease-out"
            />
          </svg>

          {/* Center Icon */}
          <HugeiconsIcon
            icon={ArrowUp02Icon}
            className="w-4 h-4 text-zinc-300 group-hover:text-white transition-transform duration-200 group-hover:-translate-y-0.5 relative z-10"
          />
        </div>

        {/* Percentage Badge: Displayed beside the ring on desktop only */}
        <span className="sr-only">Page scrolled {percentage}%</span>
        <span
          aria-hidden="true"
          className="hidden sm:inline-block pl-1 text-[11px] font-mono tabular-nums text-zinc-400 group-hover:text-zinc-200 transition-colors select-none"
        >
          {percentage}%
        </span>
      </button>
    </div>
  )
}
