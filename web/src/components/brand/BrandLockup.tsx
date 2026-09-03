import { LogoMark } from "./LogoMark"
import { cn } from "../../lib/utils"

export interface BrandLockupProps {
  size?: number
  layout?: "horizontal" | "vertical"
  showTagline?: boolean
  tagline?: string
  className?: string
}

export function BrandLockup({
  size = 32,
  layout = "horizontal",
  showTagline = true,
  tagline = "Digital Fitting Room",
  className,
}: BrandLockupProps) {
  if (layout === "vertical") {
    return (
      <div className={cn("inline-flex flex-col items-center gap-3 select-none text-center", className)}>
        <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center text-white shadow-sm">
          <LogoMark size={size} className="text-zinc-100" decorative={true} />
        </div>
        <div className="space-y-0.5">
          <span className="text-lg font-medium tracking-tight text-white block leading-none">
            V Try-On
          </span>
          {showTagline && (
            <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono block">
              {tagline}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-center text-white shadow-sm shrink-0">
        <LogoMark size={size} className="text-zinc-100" decorative={true} />
      </div>
      <div className="flex flex-col">
        <span className="text-base font-medium tracking-tight text-white leading-none">
          V Try-On
        </span>
        {showTagline && (
          <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono mt-1">
            {tagline}
          </span>
        )}
      </div>
    </div>
  )
}
