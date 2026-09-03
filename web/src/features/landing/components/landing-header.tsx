import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Logo } from "../../../components/brand/logo"
import { useAuth } from "../../auth"
import { ROUTES } from "../../../app/route-paths"
import { Sheet, SheetTrigger, SheetContent } from "../../../components/ui/sheet"
import { scrollToSection } from "../../../lib/utils/scroll-to-section"
import { cn } from "../../../lib/utils"

export function LandingHeader() {
  const { isAuthenticated } = useAuth()
  const [isScrolled, setIsScrolled] = useState<boolean>(false)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Experience", href: "#experience" },
    { label: "Privacy", href: "#privacy" },
    { label: "Trust", href: "#trust" },
  ]

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
          ? "border-b border-zinc-800/80 bg-black/85 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Brand */}
        <Logo />

        {/* Desktop Navigation Anchors */}
        <nav
          aria-label="Landing navigation"
          className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-zinc-400"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="py-2 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Action CTAs (Standardized 40px height rhythm) */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to={ROUTES.studio}
              className="h-10 px-5 text-sm font-medium bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg whitespace-nowrap inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              Open Studio
            </Link>
          ) : (
            <>
              <Link
                to={ROUTES.login}
                className="h-10 px-4 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900/60 rounded-lg whitespace-nowrap inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.register}
                className="h-10 px-5 text-sm font-medium bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg whitespace-nowrap inline-flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                <span>Start your try-on</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Sheet */}
        <div className="flex lg:hidden items-center gap-2">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger
              aria-label="Open mobile menu"
              className="h-11 w-11 p-0 rounded-lg border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-300 hover:text-white inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <HugeiconsIcon icon={Menu01Icon} className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[88vw] max-w-[360px] sm:max-w-[380px] bg-zinc-950 border-l border-zinc-800 text-zinc-100 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6 pt-2">
                <Logo />

                <nav className="flex flex-col space-y-2 pt-4 text-base font-medium text-zinc-400">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="min-h-[48px] flex items-center px-3 rounded-lg text-base font-medium text-zinc-300 hover:text-white hover:bg-zinc-900/60 transition-colors w-full cursor-pointer"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Mobile CTA Buttons (Standardized 48px height rhythm) */}
              <div className="space-y-3 pt-6 border-t border-zinc-900">
                {isAuthenticated ? (
                  <Link
                    to={ROUTES.studio}
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full h-12 text-sm font-medium bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl flex items-center justify-center transition-colors"
                  >
                    Open Studio
                  </Link>
                ) : (
                  <>
                    <Link
                      to={ROUTES.register}
                      onClick={() => setIsMobileOpen(false)}
                      className="w-full h-12 text-sm font-medium bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl flex items-center justify-center transition-colors"
                    >
                      Start your try-on
                    </Link>
                    <Link
                      to={ROUTES.login}
                      onClick={() => setIsMobileOpen(false)}
                      className="w-full h-12 text-sm font-medium border border-zinc-800 hover:bg-zinc-900 text-zinc-300 rounded-xl flex items-center justify-center transition-colors"
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
