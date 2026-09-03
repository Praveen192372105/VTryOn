import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { ShimmerCta } from "./shimmer-cta"
import { TypingHeadline } from "./typing-headline"
import { HeroAmbientSvg } from "../illustrations/hero-ambient-svg"
import { SectionPattern } from "../patterns"
import { scrollToSection } from "../../../lib/utils/scroll-to-section"
import { buttonVariants } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"

export function HeroSection() {
  return (
    <section
      id="hero"
      data-section="01"
      className="relative min-h-[calc(100svh-4rem)] flex flex-col items-center justify-between pt-12 pb-8 md:pt-16 md:pb-12 border-b border-zinc-900/80 overflow-hidden"
    >
      {/* Background Architectural Radial Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(39,39,42,0.2),transparent_70%)] pointer-events-none" />

      {/* High-Visibility Full Grid Field with Directional Flow & Nodes */}
      <SectionPattern preset="hero" />

      {/* Main Centered Hero Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center my-auto space-y-8">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950/80 text-xs font-mono text-zinc-400 tracking-wide select-none">
          <HugeiconsIcon icon={SparklesIcon} className="w-3.5 h-3.5 text-zinc-300" />
          <span>AI VIRTUAL TRY-ON, DESIGNED AROUND YOU</span>
        </div>

        {/* Stable Primary H1 */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white leading-[1.06] max-w-4xl mx-auto">
          See the outfit on you.
        </h1>

        {/* Animated Secondary Typing Headline */}
        <TypingHeadline />

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Upload a photo, choose an outfit and create a personalized virtual try-on designed to help you visualize the look on yourself.
        </p>

        {/* Action Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <ShimmerCta />
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection("how-it-works")
            }}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto border-zinc-800 hover:bg-zinc-900 text-zinc-300 h-12 text-base gap-2"
            )}
          >
            <span>See how it works</span>
            <HugeiconsIcon icon={ArrowDown01Icon} className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        {/* Product Transparency Footnote */}
        <div className="text-xs font-mono text-zinc-500 pt-1">
          <span>* V Try-On generates a visual interpretation, not a physical sizing guarantee.</span>
        </div>

        {/* Subtle Centered Ambient Vector Atmosphere */}
        <div className="pt-4 max-w-2xl mx-auto opacity-75">
          <HeroAmbientSvg className="h-20 sm:h-24 md:h-28" />
        </div>
      </div>

      {/* Subtle Scroll to Explore Indicator */}
      <div className="relative z-10 pt-4 pb-2 text-center select-none">
        <a
          href="#thesis"
          onClick={(e) => {
            e.preventDefault()
            scrollToSection("thesis")
          }}
          className="inline-flex flex-col items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 rounded-md py-1 px-2"
        >
          <span>Scroll to explore</span>
          <HugeiconsIcon icon={ArrowDown01Icon} className="w-3 h-3 animate-bounce" style={{ animationDuration: "2s" }} />
        </a>
      </div>
    </section>
  )
}
