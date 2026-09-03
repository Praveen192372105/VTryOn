export function DeviceSystemSvg() {
  return (
    <div
      role="img"
      aria-label="Vector composition of desktop, tablet, and mobile device outlines demonstrating adaptive fitting studio layouts"
      className="w-full max-w-2xl mx-auto aspect-[16/9] flex items-center justify-center select-none"
    >
      <svg
        viewBox="0 0 640 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-zinc-100"
      >
        {/* 1. Desktop Frame (Back, wide) */}
        <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.3">
          <rect x="50" y="30" width="380" height="240" rx="10" fill="#09090b" />
          {/* Header bar */}
          <line x1="50" y1="60" x2="430" y2="60" />
          {/* Desktop Dual Split Studio */}
          <rect x="75" y="80" width="150" height="170" rx="6" strokeDasharray="3 3" strokeOpacity="0.4" />
          <rect x="255" y="80" width="150" height="170" rx="6" strokeDasharray="3 3" strokeOpacity="0.4" />
          {/* Stand */}
          <path d="M 210 270 L 210 300 L 270 300 L 270 270" />
          <line x1="180" y1="300" x2="300" y2="300" />
        </g>

        {/* 2. Tablet Frame (Mid right) */}
        <g stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6">
          <rect x="330" y="80" width="200" height="230" rx="8" fill="#0a0a0c" />
          <line x1="330" y1="105" x2="530" y2="105" strokeOpacity="0.3" />
          {/* Tablet Two-pane studio */}
          <rect x="345" y="120" width="80" height="165" rx="4" strokeDasharray="2 2" strokeOpacity="0.4" />
          <rect x="435" y="120" width="80" height="165" rx="4" strokeDasharray="2 2" strokeOpacity="0.4" />
        </g>

        {/* 3. Mobile Device (Front right) */}
        <g stroke="currentColor" strokeWidth="1.5">
          <rect x="470" y="130" width="120" height="210" rx="14" fill="#000000" />
          {/* Camera notch / dynamic bar */}
          <rect x="515" y="138" width="30" height="5" rx="2.5" fill="currentColor" fillOpacity="0.4" />
          {/* Mobile Single Stack Flow */}
          <rect x="485" y="155" width="90" height="110" rx="6" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.5" />
          <rect x="485" y="275" width="90" height="24" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="0.8" />
          {/* Bottom indicator */}
          <line x1="510" y1="332" x2="550" y2="332" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}
