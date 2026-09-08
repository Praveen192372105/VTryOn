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
      className="relative min-h-[calc(100svh-4rem)] flex flex-col items-center justify-between pt-12 pb-8 md:pt-16 md:pb-12 border-b border-border overflow-hidden"
    >
      {/* Background Architectural Radial Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--surface-subtle),transparent_70%)] pointer-events-none" />

      {/* High-Visibility Full Grid Field with Directional Flow & Nodes */}
      <SectionPattern preset="hero" />

      {/* Main Responsive Hero Content:
          Phone: Single-column editorial stack (items-center text-center)
          Tablet: Image/text asymmetry (md:grid md:grid-cols-12 md:text-left)
          Desktop: Two-column cinematic composition (lg:grid-cols-12 gap-12 items-center)
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Editorial Column */}
          <div className="md:col-span-7 lg:col-span-6 space-y-6 sm:space-y-8 text-center md:text-left flex flex-col items-center md:items-start">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-mono text-muted-foreground tracking-wide select-none shadow-2xs">
              <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-foreground" />
              <span>AI VIRTUAL TRY-ON, DESIGNED AROUND YOU</span>
            </div>

            {/* Stable Primary H1 */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-foreground leading-[1.06]">
              See the outfit on you.
            </h1>

            {/* Animated Secondary Typing Headline */}
            <TypingHeadline />

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed font-normal">
              Upload a photo, choose an outfit and create a personalized virtual try-on designed to help you visualize the look on yourself.
            </p>

            {/* Action Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2 w-full sm:w-auto">
              <ShimmerCta />
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection("how-it-works")
                }}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto border-border hover:bg-surface-subtle text-foreground h-12 text-base gap-2"
                )}
              >
                <span>See how it works</span>
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 opacity-70" />
              </a>
            </div>

            {/* Product Transparency Footnote */}
            <div className="text-xs font-mono text-muted-foreground pt-1">
              <span>* V Try-On generates a visual interpretation, not a physical sizing guarantee.</span>
            </div>
          </div>

          {/* Visual Showcase Column (Asymmetry on Tablet, Cinematic Composition on Desktop) */}
          <div className="md:col-span-5 lg:col-span-6 flex justify-center w-full">
            <div className="w-full max-w-md lg:max-w-lg rounded-2xl border border-border/80 bg-surface/80 p-5 sm:p-6 backdrop-blur-md shadow-lg relative overflow-hidden group">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-radial from-primary/[0.04] via-transparent to-transparent pointer-events-none"
              />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Virtual Try-On Studio</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground bg-surface-subtle px-2 py-0.5 rounded border border-border/50">Preview</span>
                </div>
                <div className="opacity-90 py-2">
                  <HeroAmbientSvg className="h-28 sm:h-32 md:h-36 lg:h-44 w-full" />
                </div>
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">Input: Photo + Garment</span>
                  <span className="font-mono text-primary">Output: Personalized Look</span>
                </div>
              </div>
            </div>
          </div>
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
          className="inline-flex flex-col items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md py-1 px-2"
        >
          <span>Scroll to explore</span>
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3 animate-bounce" style={{ animationDuration: "2s" }} />
        </a>
      </div>
    </section>
  )
}
