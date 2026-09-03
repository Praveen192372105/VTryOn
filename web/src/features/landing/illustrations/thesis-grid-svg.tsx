export function ThesisGridSvg() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center opacity-10"
    >
      <svg
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-zinc-100"
      >
        {/* Tailoring Grid Lines */}
        <g stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 6">
          <line x1="100" y1="0" x2="100" y2="600" />
          <line x1="300" y1="0" x2="300" y2="600" />
          <line x1="500" y1="0" x2="500" y2="600" />
          <line x1="700" y1="0" x2="700" y2="600" />
          <line x1="900" y1="0" x2="900" y2="600" />
          <line x1="0" y1="150" x2="1000" y2="150" />
          <line x1="0" y1="300" x2="1000" y2="300" />
          <line x1="0" y1="450" x2="1000" y2="450" />
        </g>

        {/* Diagonal Dart Lines */}
        <path
          d="M 150 100 L 450 500 M 850 100 L 550 500"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />

        {/* Large Decorative Typography Abstraction */}
        <text
          x="500"
          y="350"
          textAnchor="middle"
          fill="currentColor"
          fontSize="140"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          letterSpacing="0.25em"
          opacity="0.3"
        >
          SILHOUETTE
        </text>
      </svg>
    </div>
  )
}
