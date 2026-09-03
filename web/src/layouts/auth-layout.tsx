import { Link, Outlet } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { AuthBackground } from "../components/backgrounds"
import { ROUTES } from "../app/route-paths"

export function AuthLayout() {
  return (
    <AuthBackground>
      {/* Top Navigation Bar: Back to Home */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex items-center justify-between z-20 shrink-0">
        <Link
          to={ROUTES.home}
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors h-10 px-3.5 rounded-lg border border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          <span>Back to home</span>
        </Link>
      </header>

      {/* Main Centered Content Zone: Natural Document Flow & Safe Overflow */}
      <main className="flex-1 w-full flex flex-col items-center justify-center px-4 py-6 sm:py-8 auth-viewport-short z-20">
        <div className="w-full my-auto flex justify-center">
          <Outlet />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-center text-xs font-mono text-zinc-600 z-20 shrink-0">
        <span>© {new Date().getFullYear()} V Try-On • Private & Account-Isolated Architecture</span>
      </footer>
    </AuthBackground>
  )
}
