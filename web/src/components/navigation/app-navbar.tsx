import { Link, useLocation, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings01Icon,
  Logout01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { useAuth } from "../../features/auth"
import { ROUTES } from "../../app/route-paths"
import { PRIMARY_NAVIGATION } from "../../config/navigation"
import { Logo } from "../brand/logo"
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

export function AppNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-black/80 backdrop-blur-md">
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
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                  )}
                >
                  <HugeiconsIcon icon={item.icon} className="w-4 h-4 opacity-70" />
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
                "gap-2 px-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 cursor-pointer"
              )}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                <HugeiconsIcon icon={UserIcon} className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium max-w-[120px] truncate hidden sm:inline-block">
                {user?.name || user?.email || "Account"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-zinc-100">{user?.name || "User"}</p>
                  <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={() => navigate(ROUTES.settings)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
              >
                <HugeiconsIcon icon={Logout01Icon} className="w-4 h-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
