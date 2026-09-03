import { useState } from "react"

export function ResultCompareSvg() {
  const [sliderPos, setSliderPos] = useState<number>(50)

  return (
    <div
      role="img"
      aria-label="Abstract two-panel vector comparison visual showing original silhouette vs fitted silhouette with interactive divider"
      className="w-full max-w-md mx-auto aspect-[3/4] rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 flex flex-col justify-between select-none relative overflow-hidden"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-zinc-900 pb-3">
        <span className="tracking-widest uppercase">COMPARISON_VIEWPORT</span>
        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
          SPLIT: {sliderPos}%
        </span>
      </div>

      {/* Main Dual Vector Silhouette Area */}
      <div className="relative flex-1 my-4 flex items-center justify-center">
        <svg
          viewBox="0 0 300 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-zinc-100"
        >
          {/* Base Head / Neck shared */}
          <ellipse cx="150" cy="80" rx="24" ry="30" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.7" />
          <path d="M 138 108 L 138 125 M 162 108 L 162 125" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />

          {/* Left Side: Original Torso Outline */}
          <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3">
            <path d="M 138 125 C 120 130 90 145 80 180 L 70 270" />
            <path d="M 105 180 L 100 320" />
          </g>

          {/* Right Side: Synthesized Garment Silhouette */}
          <g stroke="currentColor" strokeWidth="1.5">
            <path
              d="M 150 145 L 180 125 L 210 140 L 225 210 L 200 220 L 195 180 L 196 320 L 150 320"
              fill="currentColor"
              fillOpacity="0.08"
            />
            {/* Seam line */}
            <line x1="150" y1="145" x2="150" y2="320" stroke="currentColor" strokeWidth="1.5" />
          </g>

          {/* Divider Line & Handle */}
          <line
            x1={(sliderPos / 100) * 300}
            y1="20"
            x2={(sliderPos / 100) * 300}
            y2="360"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          <circle
            cx={(sliderPos / 100) * 300}
            cy="190"
            r="10"
            fill="#09090b"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d={`M ${(sliderPos / 100) * 300 - 4} 190 L ${(sliderPos / 100) * 300 + 4} 190`}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Interactive Slider Affordance */}
      <div className="space-y-2 pt-2 border-t border-zinc-900">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>ORIGINAL</span>
          <span>FITTED LOOK</span>
        </div>
        <input
          type="range"
          min="10"
          max="90"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="w-full accent-zinc-200 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
          aria-label="Before and after split slider"
        />
      </div>
    </div>
  )
}
