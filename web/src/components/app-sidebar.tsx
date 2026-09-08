import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SparklesIcon,
  Shirt01Icon,
  FavouriteIcon,
  Camera01Icon,
  Clock01Icon,
  Settings01Icon,
  Logout01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/brand/Logo"
import { ROUTES } from "@/app/route-paths"
import { cn } from "@/lib/utils"

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: { name?: string; email?: string } | null
  onLogout?: () => void
}

interface NavItem {
  title: string
  url: string
  icon: typeof SparklesIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Fitting Room",
    items: [
      {
        title: "Try-On Studio",
        url: ROUTES.studio,
        icon: SparklesIcon,
      },
    ],
  },
  {
    label: "Wardrobe & Media",
    items: [
      {
        title: "Garment Catalog",
        url: ROUTES.outfits,
        icon: Shirt01Icon,
      },
      {
        title: "Saved Favorites",
        url: ROUTES.favorites,
        icon: FavouriteIcon,
      },
      {
        title: "Model Photos",
        url: ROUTES.uploads,
        icon: Camera01Icon,
      },
    ],
  },
  {
    label: "Activity & System",
    items: [
      {
        title: "Generation History",
        url: ROUTES.history,
        icon: Clock01Icon,
      },
      {
        title: "Settings",
        url: ROUTES.settings,
        icon: Settings01Icon,
      },
    ],
  },
]

export function AppSidebar({ user, onLogout, className, ...props }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Sidebar
      collapsible="icon"
      className={cn("border-r border-sidebar-border bg-sidebar text-sidebar-foreground", className)}
      {...props}
    >
      {/* Brand Header - Left-aligned in expanded mode, perfectly centered in collapsed icon mode */}
      <SidebarHeader className="h-14 border-b border-sidebar-border px-3 flex items-center justify-start group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        <Link
          to={ROUTES.studio}
          className="flex items-center justify-start group-data-[collapsible=icon]:justify-center w-full focus-visible:outline-none"
        >
          <Logo linkToHome={false} className="gap-2.5" />
        </Link>
      </SidebarHeader>

      {/* Navigation Groups - Clean left text in expanded, strictly centered icons in collapsed */}
      <SidebarContent className="px-2 py-3 space-y-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        {navGroups.map((group) => (
          <SidebarGroup
            key={group.label}
            className="p-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:items-center"
          >
            <SidebarGroupLabel className="px-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent className="w-full">
              <SidebarMenu className="gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full">
                {group.items.map((item) => {
                  const isActive =
                    location.pathname === item.url ||
                    (item.url !== ROUTES.studio && location.pathname.startsWith(item.url))

                  return (
                    <SidebarMenuItem
                      key={item.title}
                      className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full"
                    >
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link to={item.url} />}
                        className={cn(
                          "transition-colors text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                          "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!",
                          isActive && "bg-sidebar-accent text-sidebar-foreground font-medium shadow-2xs"
                        )}
                      >
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4 shrink-0 opacity-80" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* User & Logout Footer - Clean left card in expanded, centered icons in collapsed */}
      <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        {/* Expanded View */}
        <div className="group-data-[collapsible=icon]:hidden flex items-center justify-between gap-2 rounded-xl bg-surface-subtle/80 p-2 border border-sidebar-border w-full">
          <button
            type="button"
            onClick={() => navigate(ROUTES.settings)}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity flex-1 cursor-pointer"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-surface border border-sidebar-border text-muted-foreground shrink-0 shadow-2xs">
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-sidebar-foreground truncate">
                {user?.name || "Account"}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {user?.email || "Signed in"}
              </span>
            </div>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-subtle/20 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" />
            </button>
          )}
        </div>

        {/* Collapsed View - Centered on the 48px rail */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center justify-center gap-2 w-full">
          <button
            type="button"
            onClick={() => navigate(ROUTES.settings)}
            title={user?.name || user?.email || "Account Settings"}
            className="flex aspect-square size-8 items-center justify-center rounded-lg bg-surface border border-sidebar-border text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="flex aspect-square size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-subtle/20 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" />
            </button>
          )}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
