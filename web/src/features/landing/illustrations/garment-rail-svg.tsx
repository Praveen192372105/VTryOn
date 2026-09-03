import { useState } from "react"
import { motion } from "motion/react"
import { useReducedMotion } from "../../../hooks/use-reduced-motion"

export function GarmentRailSvg() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const prefersReduced = useReducedMotion()

  const items = [
    {
      id: "tops",
      label: "TOPS",
      name: "Tailored Oxford Shirt",
      d: "M 35 30 L 65 55 L 95 30 L 125 45 L 135 110 L 115 115 L 110 80 L 112 170 L 18 170 L 20 80 L 15 115 L -5 110 L 5 45 Z",
    },
    {
      id: "outerwear",
      label: "OUTERWEAR",
      name: "Minimalist Trench",
      d: "M 30 25 L 65 55 L 100 25 L 135 40 L 145 130 L 125 135 L 120 90 L 125 210 L 5 210 L 10 90 L 5 135 L -15 130 L -5 40 Z",
    },
    {
      id: "dresses",
      label: "DRESSES",
      name: "Column Evening Dress",
      d: "M 45 35 L 65 50 L 85 35 L 100 45 L 105 100 L 98 120 L 120 220 L 10 220 L 32 120 L 25 100 L 30 45 Z",
    },
  ]

  return (
    <div
      role="img"
      aria-label="Interactive vector garment rail showcasing tops, outerwear, and dresses with animated selection ring"
      className="w-full max-w-2xl mx-auto select-none py-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((item, idx) => {
          const isSelected = selectedIdx === idx
          return (
            <div
              key={item.id}
              onClick={() => setSelectedIdx(idx)}
              className={`relative rounded-xl border p-5 transition-colors cursor-pointer flex flex-col items-center justify-between aspect-[3/4] ${
                isSelected
                  ? "border-zinc-500 bg-zinc-900/60 shadow-lg"
                  : "border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/30"
              }`}
            >
              {/* Category Pill */}
              <div className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="tracking-wider">{item.label}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                )}
              </div>

              {/* Garment SVG Line Art */}
              <div className="my-auto w-28 h-36 flex items-center justify-center">
                <svg
                  viewBox="0 0 130 230"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full text-zinc-200"
                >
                  <motion.path
                    d={item.d}
                    fill={isSelected ? "currentColor" : "none"}
                    fillOpacity={isSelected ? 0.08 : 0}
                    stroke="currentColor"
                    strokeWidth={isSelected ? 1.5 : 1}
                    strokeOpacity={isSelected ? 0.9 : 0.4}
                    initial={false}
                    animate={
                      prefersReduced
                        ? {}
                        : isSelected
                        ? { scale: [0.98, 1, 0.98] }
                        : {}
                    }
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Fine seam accent */}
                  <line
                    x1="65"
                    y1="55"
                    x2="65"
                    y2="170"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    strokeDasharray="2 3"
                    strokeOpacity="0.4"
                  />
                </svg>
              </div>

              {/* Garment Label */}
              <div className="text-center">
                <p className="text-xs font-medium text-zinc-200">{item.name}</p>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  {isSelected ? "[SELECTED_FOR_TRYON]" : "TAP_TO_SELECT"}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
