import { useEffect } from "react"
import { Link, useLocation, Outlet } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon01Icon } from "@hugeicons/core-free-icons"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileTabBar } from "@/components/navigation/mobile-tabbar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ROUTES } from "@/app/route-paths"
import { useTheme } from "@/lib/theme/theme-provider"
import { PageTransition } from "./page-transition"
import "./app-theme.css"

export interface AppLayoutProps {
  user?: { name?: string; email?: string } | null
  onLogout?: () => void
}

const ROUTE_TITLES: Record<string, { title: string; parent?: string }> = {
  "/app": { title: "Fitting Room" },
  "/app/studio": { title: "Try-On Studio" },
  "/app/outfits": { title: "Wardrobe Catalog" },
  "/app/favorites": { title: "Saved Favorites" },
  "/app/uploads": { title: "Model Photos" },
  "/app/history": { title: "Generation History" },
  "/app/settings": { title: "Account & Settings" },
}

export function AppLayout({ user, onLogout }: AppLayoutProps = {}) {
  const location = useLocation()
  const { resolvedTheme, setTheme } = useTheme()

  const currentRoute = ROUTE_TITLES[location.pathname] || {
    title: location.pathname.includes("/try-ons/") ? "Job Details" : "Workspace",
  }

  // Route-level focus management: shift focus to main content on route navigation
  useEffect(() => {
    const mainEl = document.getElementById("main-content")
    if (mainEl) {
      mainEl.focus({ preventScroll: true })
    }
  }, [location.pathname])

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        {/* Accessible Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-md focus:outline-none"
        >
          Skip to main content
        </a>

        <AppSidebar user={user} onLogout={onLogout} />

        <SidebarInset className="premium-app bg-background text-foreground flex flex-col min-h-screen">
          {/* Top Bar with Sidebar Trigger, Breadcrumbs, and Quick Theme Switcher */}
          <header className="app-topbar sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
              <Separator orientation="vertical" className="mr-2 h-4 bg-border" />
              <Breadcrumb className="truncate">
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink render={<Link to={ROUTES.app.studio} />} className="text-muted-foreground hover:text-foreground">
                      V Try-On
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-muted-foreground/50" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium text-foreground">
                      {currentRoute.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Controls: Quick Theme Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="size-8 rounded-lg border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors shadow-2xs cursor-pointer"
                title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              >
                <HugeiconsIcon
                  icon={resolvedTheme === "dark" ? Sun01Icon : Moon01Icon}
                  className="size-4"
                />
              </button>
            </div>
          </header>

          {/* Page Shell Main Content with bottom padding reserved for mobile bottom tab bar */}
          <main
            id="main-content"
            tabIndex={-1}
            className="app-main flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 focus:outline-none"
          >
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileTabBar />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
