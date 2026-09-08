import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon, ArrowRight01Icon, Sun01Icon, Moon01Icon } from "@hugeicons/core-free-icons"
import { Logo } from "../../../components/brand/Logo"
import { useAuth } from "../../auth"
import { ROUTES } from "../../../app/route-paths"
import { landingNavigation } from "../../../config/navigation"
import { Sheet, SheetTrigger, SheetContent } from "../../../components/ui/sheet"
import { scrollToSection } from "../../../lib/utils/scroll-to-section"
import { useTheme } from "../../../lib/theme/theme-provider"
import { cn } from "../../../lib/utils"

export function LandingHeader() {
  const { isAuthenticated } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [isScrolled, setIsScrolled] = useState<boolean>(false)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = landingNavigation

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    scrollToSection(href)
    setIsMobileOpen(false)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        isScrolled
          ? "border-b border-border/80 bg-background/85 backdrop-blur-md shadow-2xs"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Brand */}
        <Logo />

        {/* Desktop Navigation Anchors */}
        <nav
          aria-label="Landing navigation"
          className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-muted-foreground"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="py-2 hover:text-foreground transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Action CTAs & Theme Toggle */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="size-9 rounded-lg border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors shadow-2xs cursor-pointer"
            title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            <HugeiconsIcon
              icon={resolvedTheme === "dark" ? Sun01Icon : Moon01Icon}
              className="size-4"
            />
          </button>

          {isAuthenticated ? (
            <Link
              to={ROUTES.studio}
              className="h-10 px-5 text-sm font-medium bg-primary hover:opacity-90 text-primary-foreground rounded-lg whitespace-nowrap inline-flex items-center justify-center transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-xs"
            >
              Open Studio
            </Link>
          ) : (
            <>
              <Link
                to={ROUTES.login}
                className="h-10 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-lg whitespace-nowrap inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.register}
                className="h-10 px-5 text-sm font-medium bg-primary hover:opacity-90 text-primary-foreground rounded-lg whitespace-nowrap inline-flex items-center justify-center gap-1.5 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-xs"
              >
                <span>Start your try-on</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Controls: Theme Toggle & Hamburger Sheet */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="h-11 w-11 rounded-lg border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
            title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            <HugeiconsIcon
              icon={resolvedTheme === "dark" ? Sun01Icon : Moon01Icon}
              className="size-4"
            />
          </button>

          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger
              aria-label="Open mobile menu"
              className="h-11 w-11 p-0 rounded-lg border border-border bg-surface hover:bg-surface-subtle text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <HugeiconsIcon icon={Menu01Icon} className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[88vw] max-w-[360px] sm:max-w-[380px] bg-card border-l border-border text-card-foreground p-5 sm:p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6 pt-2">
                <Logo />

                <nav className="flex flex-col space-y-2 pt-4 text-base font-medium text-muted-foreground">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="min-h-[48px] flex items-center px-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-colors w-full cursor-pointer"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Mobile CTA Buttons (Standardized 48px height rhythm) */}
              <div className="space-y-3 pt-6 border-t border-border">
                {isAuthenticated ? (
                  <Link
                    to={ROUTES.studio}
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full h-12 text-sm font-medium bg-primary hover:opacity-90 text-primary-foreground rounded-xl flex items-center justify-center transition-opacity shadow-xs"
                  >
                    Open Studio
                  </Link>
                ) : (
                  <>
                    <Link
                      to={ROUTES.register}
                      onClick={() => setIsMobileOpen(false)}
                      className="w-full h-12 text-sm font-medium bg-primary hover:opacity-90 text-primary-foreground rounded-xl flex items-center justify-center gap-1.5 transition-opacity shadow-xs"
                    >
                      <span>Start your try-on</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                    </Link>
                    <Link
                      to={ROUTES.login}
                      onClick={() => setIsMobileOpen(false)}
                      className="w-full h-12 text-sm font-medium border border-border bg-surface text-foreground hover:bg-surface-subtle rounded-xl flex items-center justify-center transition-colors"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
