import { useState, useEffect } from "react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"

interface TypingHeadlineProps {
  phrases?: string[]
  typingSpeed?: number
  deletingSpeed?: number
  holdDuration?: number
  pauseDuration?: number
  className?: string
}

const DEFAULT_PHRASES = [
  "Wear it before you wear it.",
  "Try a different look.",
  "See yourself in something new.",
  "Explore the outfit on you.",
]

export function TypingHeadline({
  phrases = DEFAULT_PHRASES,
  typingSpeed = 55,
  deletingSpeed = 30,
  holdDuration = 1800,
  pauseDuration = 350,
  className,
}: TypingHeadlineProps) {
  const prefersReduced = useReducedMotion()

  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayText, setDisplayText] = useState(() => (prefersReduced ? phrases[0] || "" : ""))
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting" | "waiting">("typing")

  useEffect(() => {
    if (prefersReduced) {
      return
    }

    const currentPhrase = phrases[phraseIndex] || ""
    let timer: ReturnType<typeof setTimeout>

    switch (phase) {
      case "typing": {
        if (displayText.length < currentPhrase.length) {
          timer = setTimeout(() => {
            setDisplayText(currentPhrase.slice(0, displayText.length + 1))
          }, typingSpeed)
        } else {
          setPhase("holding")
        }
        break
      }

      case "holding": {
        timer = setTimeout(() => {
          setPhase("deleting")
        }, holdDuration)
        break
      }

      case "deleting": {
        if (displayText.length > 0) {
          timer = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1))
          }, deletingSpeed)
        } else {
          setPhase("waiting")
        }
        break
      }

      case "waiting": {
        timer = setTimeout(() => {
          setPhraseIndex((prev) => (prev + 1) % phrases.length)
          setPhase("typing")
        }, pauseDuration)
        break
      }
    }

    return () => clearTimeout(timer)
  }, [
    displayText,
    phase,
    phraseIndex,
    phrases,
    typingSpeed,
    deletingSpeed,
    holdDuration,
    pauseDuration,
    prefersReduced,
  ])

  return (
    <div className={cn("relative min-h-[2.25rem] sm:min-h-[2.75rem] flex items-center justify-center", className)}>
      {/* Stable accessibility announcement for screen readers */}
      <span className="sr-only">
        V Try-On lets you visualize selected outfits using your own photo.
      </span>

      {/* Visual animated headline */}
      <span
        aria-hidden="true"
        className="text-xl sm:text-3xl md:text-4xl font-light text-zinc-400 tracking-tight select-none"
      >
        <span>{prefersReduced ? phrases[0] : displayText}</span>
        {!prefersReduced && (
          <span
            className="inline-block ml-1 w-[2px] h-[1em] bg-zinc-300 align-middle animate-pulse"
            style={{ animationDuration: "1s" }}
          />
        )}
      </span>
    </div>
  )
}
