import { Link, useLocation } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { PRIMARY_NAVIGATION } from "../../config/navigation"
import { cn } from "../../lib/utils"

export function MobileTabBar() {
  const location = useLocation()

  return (
    <nav
      aria-label="Mobile workspace navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {PRIMARY_NAVIGATION.map((tab) => {
          const isActive =
            location.pathname === tab.href ||
            (tab.href !== "/app/studio" && location.pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors select-none",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center size-9 rounded-xl transition-colors mb-0.5",
                  isActive ? "bg-surface-subtle border border-border text-foreground shadow-2xs" : "text-muted-foreground"
                )}
              >
                <HugeiconsIcon icon={tab.icon} className="size-5" />
              </div>
              <span className="text-[10px] tracking-tight leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
