import React from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Logo } from "../brand/Logo"
import { ROUTES } from "@/app/route-paths"
import { cn } from "@/lib/utils"

export interface PublicPolicyLayoutProps {
  title: string
  subtitle?: string
  lastUpdated: string
  children: React.ReactNode
  activePage: "privacy" | "terms"
}

export function PublicPolicyLayout({
  title,
  subtitle,
  lastUpdated,
  children,
  activePage,
}: PublicPolicyLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Policy Header Bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          <Logo />

          <Link
            to={ROUTES.home}
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors group"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-3.5 transition-transform group-hover:-translate-x-0.5"
            />
            <span>Back to overview</span>
          </Link>
        </div>
      </header>

      {/* Main Legal Content */}
      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Document Header */}
        <div className="border-b border-border/80 pb-8 mb-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Official Documentation
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Updated {lastUpdated}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Policy Switcher Tabs */}
          <div className="pt-4 flex items-center gap-2">
            <Link
              to={ROUTES.privacy}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activePage === "privacy"
                  ? "bg-surface text-foreground border border-border shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Privacy Policy
            </Link>
            <Link
              to={ROUTES.terms}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activePage === "terms"
                  ? "bg-surface text-foreground border border-border shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Prose Section Container */}
        <div className="space-y-10 text-sm text-foreground/90 leading-relaxed">
          {children}
        </div>
      </main>

      {/* Policy Footer */}
      <footer className="border-t border-border/80 py-8 bg-surface-subtle/50 text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} V Try-On. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to={ROUTES.home} className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>·</span>
            <Link to={ROUTES.howItWorks} className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <span>·</span>
            <Link to={ROUTES.privacy} className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link to={ROUTES.terms} className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
