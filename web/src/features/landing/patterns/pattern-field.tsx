import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"
import { cn } from "../../../lib/utils"
import { BoxedGridPattern } from "./boxed-grid-pattern"
import { HexagonPattern } from "./hexagon-pattern"
import { WavePattern } from "./wave-pattern"
import { TailoringGridPattern } from "./tailoring-grid-pattern"
import { DotMatrixPattern } from "./dot-matrix-pattern"
import { ThreadPattern } from "./thread-pattern"
import { ContourPattern } from "./contour-pattern"

export type PatternVariant =
  | "boxed-grid"
  | "hexagon"
  | "wave"
  | "tailoring"
  | "dots"
  | "thread"
  | "contour"

export type PatternPosition =
  | "top-right"
  | "bottom-left"
  | "top-left"
  | "bottom-right"

export type PatternIntensity = "subtle" | "default" | "strong"

interface PatternFieldProps {
  variant: PatternVariant
  position: PatternPosition
  intensity?: PatternIntensity
  className?: string
  parallaxSpeed?: "none" | "slow" | "medium"
}

export function PatternField({
  variant,
  position,
  intensity = "default",
  className,
  parallaxSpeed = "none",
}: PatternFieldProps) {
  const prefersReduced = useReducedMotion()

  const positionClasses: Record<PatternPosition, string> = {
    "top-right": "top-0 right-0 -mr-8 -mt-8 [mask-image:radial-gradient(ellipse_at_top_right,black_30%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_at_top_right,black_30%,transparent_75%)]",
    "bottom-left": "bottom-0 left-0 -ml-8 -mb-8 [mask-image:radial-gradient(ellipse_at_bottom_left,black_30%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_at_bottom_left,black_30%,transparent_75%)]",
    "top-left": "top-0 left-0 -ml-8 -mt-8 [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]",
    "bottom-right": "bottom-0 right-0 -mr-8 -mb-8 [mask-image:radial-gradient(ellipse_at_bottom_right,black_30%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_at_bottom_right,black_30%,transparent_75%)]",
  }

  const intensityClasses: Record<PatternIntensity, string> = {
    subtle: "opacity-40",
    default: "opacity-75",
    strong: "opacity-100",
  }

  const renderPattern = () => {
    switch (variant) {
      case "boxed-grid":
        return <BoxedGridPattern />
      case "hexagon":
        return <HexagonPattern />
      case "wave":
        return <WavePattern />
      case "tailoring":
        return <TailoringGridPattern />
      case "dots":
        return <DotMatrixPattern />
      case "thread":
        return <ThreadPattern />
      case "contour":
        return <ContourPattern />
      default:
        return null
    }
  }

  const MotionWrapper = (!prefersReduced && parallaxSpeed !== "none") ? motion.div : "div"

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute pointer-events-none select-none z-0 overflow-hidden",
        "w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96",
        positionClasses[position],
        intensityClasses[intensity],
        className
      )}
    >
      <MotionWrapper className="w-full h-full">
        {renderPattern()}
      </MotionWrapper>
    </div>
  )
}
