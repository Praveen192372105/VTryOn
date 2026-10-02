import { LogoMark } from "./LogoMark"
import { cn } from "../../lib/utils"

export interface AppIconProps {
  size?: number
  className?: string
  title?: string
  decorative?: boolean
}

export function AppIcon({
  size = 48,
  className,
  title = "V Try-On App Icon",
  decorative = false,
}: AppIconProps) {
  const markSize = Math.round(size * 0.62)
  const borderRadius = Math.round(size * 0.24)

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center bg-[#a77a57] text-[#fffaf2] border border-[#a77a57] shadow-sm select-none shrink-0",
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
      }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? "true" : undefined}
    >
      <LogoMark size={markSize} className="text-[#fffaf2]" decorative={true} />
    </div>
  )
}
