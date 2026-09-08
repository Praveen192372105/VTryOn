import { Link, useLocation, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings01Icon,
  Logout01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { ROUTES } from "../../app/route-paths"
import { PRIMARY_NAVIGATION } from "../../config/navigation"
import { Logo } from "../brand/Logo"
import { cn } from "../../lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { buttonVariants } from "../ui/button"

export interface AppNavbarProps {
  user?: { name?: string; email?: string } | null
  onLogout?: () => void
}

export function AppNavbar({ user, onLogout }: AppNavbarProps = {}) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Logo />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {PRIMARY_NAVIGATION.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-surface-subtle text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                  )}
                >
                  <HugeiconsIcon icon={item.icon} className="size-4 opacity-70" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-2 px-2 text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer"
              )}
            >
              <div className="flex items-center justify-center size-7 rounded-full bg-surface-subtle border border-border text-foreground">
                <HugeiconsIcon icon={UserIcon} className="size-3.5" />
              </div>
              <span className="text-xs font-medium max-w-[120px] truncate hidden sm:inline-block text-foreground">
                {user?.name || user?.email || "Account"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface border-border text-foreground">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => navigate(ROUTES.settings)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <HugeiconsIcon icon={Settings01Icon} className="size-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => onLogout?.()}
                className="flex items-center gap-2 text-danger hover:text-danger focus:text-danger cursor-pointer"
              >
                <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
