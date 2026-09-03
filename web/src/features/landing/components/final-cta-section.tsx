import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { useAuth } from "../../auth"
import { ROUTES } from "../../../app/route-paths"
import { buttonVariants } from "../../../components/ui/button"
import { FinalClosureSvg } from "../illustrations/final-closure-svg"
import { SectionPattern } from "../patterns"
import { cn } from "../../../lib/utils"

export function FinalCtaSection() {
  const { isAuthenticated } = useAuth()
  const primaryRoute = isAuthenticated ? ROUTES.studio : ROUTES.register
  const primaryLabel = isAuthenticated ? "Open your fitting room" : "Start your try-on"

  return (
    <section
      id="final-cta"
      data-section="14"
      className="relative py-24 sm:py-32 border-b border-zinc-900 bg-zinc-950/60 overflow-hidden text-center"
    >
      {/* High-Visibility Resolving Pattern Grid & Organic Threads */}
      <SectionPattern preset="final" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-mono text-zinc-400 tracking-wide uppercase">
          <span className="text-zinc-600 font-semibold">14 —</span>
          <span>READY TO BEGIN</span>
        </div>

        {/* Narrative Closure SVG */}
        <div className="py-2">
          <FinalClosureSvg />
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            Your next look starts with your photo.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Enter the virtual fitting room now and preview curated collections on your silhouette.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to={primaryRoute}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full sm:w-auto bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-8 h-12 text-base gap-2"
            )}
          >
            <span>{primaryLabel}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
          </Link>

          {!isAuthenticated && (
            <Link
              to={ROUTES.login}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto border-zinc-800 hover:bg-zinc-900 text-zinc-300 h-12 text-base"
              )}
            >
              Sign in to your account
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
