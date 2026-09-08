import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { WifiDisconnected01Icon } from "@hugeicons/core-free-icons"
import { cn } from "../../lib/utils"

export interface OfflineBannerProps {
  className?: string
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div
      role="alert"
      className={cn(
        "bg-amber-600/90 text-white text-xs px-4 py-2 flex items-center justify-center gap-2 font-medium tracking-wide shadow-sm sticky top-0 z-50",
        className
      )}
    >
      <HugeiconsIcon icon={WifiDisconnected01Icon} size={16} className="shrink-0" />
      <span>You appear to be offline. Network requests will resume when connectivity returns.</span>
    </div>
  )
}
