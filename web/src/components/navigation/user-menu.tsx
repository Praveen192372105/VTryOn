import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { Link } from "react-router-dom"
import { Button } from "../ui/button"
import { ROUTES } from "../../app/route-paths"
import { cn } from "../../lib/utils"

export interface UserMenuProps {
  user?: { name?: string; email?: string } | null
  onLogout?: () => void
  className?: string
}

export function UserMenu({ user, onLogout, className }: UserMenuProps) {
  const displayName = user?.name || user?.email?.split("@")[0] || "Account"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link
        to={ROUTES.app.settings}
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
        aria-label="Account Settings"
      >
        <HugeiconsIcon icon={UserIcon} size={15} />
        <span className="max-w-[120px] truncate">{displayName}</span>
      </Link>
      {onLogout && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          aria-label="Log out"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <HugeiconsIcon icon={Logout01Icon} size={15} />
        </Button>
      )}
    </div>
  )
}
