import { Link, useLocation } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { PRIMARY_NAVIGATION } from "../../config/navigation"
import { cn } from "../../lib/utils"

export function MobileTabBar() {
  const location = useLocation()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-lg border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around h-16 px-2">
        {PRIMARY_NAVIGATION.map((tab) => {
          const isActive = location.pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors",
                isActive ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center p-1.5 rounded-full transition-colors mb-0.5",
                  isActive ? "bg-zinc-800 text-zinc-100" : "text-zinc-500"
                )}
              >
                <HugeiconsIcon icon={tab.icon} className="w-5 h-5" />
              </div>
              <span className="text-[11px] leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
