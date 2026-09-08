import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Camera01Icon,
  Shirt01Icon,
  SparklesIcon,
  ViewIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { useAuth } from "../../features/auth"
import { Logo } from "../../components/brand/Logo"
import { Button } from "../../components/ui/button"
import { ROUTES } from "../../app/route-paths"

export default function HowItWorksPage() {
  useDocumentTitle("How It Works · V Try-On")
  const { isAuthenticated } = useAuth()

  const steps = [
    {
      num: "01",
      icon: Camera01Icon,
      title: "Upload Silhouette Portrait",
      description:
        "Upload a full-length or upper-body portrait photograph against a clean backdrop. Our system isolates posture, shoulder slope, and limb contours without storing identifying biometrics.",
    },
    {
      num: "02",
      icon: Shirt01Icon,
      title: "Select Curated Garments",
      description:
        "Explore high-fashion tops, bottoms, dresses, and outerwear curated in the catalogue. Each item is pre-processed for diffusion drape mapping.",
    },
    {
      num: "03",
      icon: SparklesIcon,
      title: "Asynchronous GPU Synthesis",
      description:
        "Your fitting job is submitted to our Celery task worker queue. A dedicated diffusion pipeline (CatVTON) maps garment textures and folds onto your body contour.",
    },
    {
      num: "04",
      icon: ViewIcon,
      title: "Inspect & Compare",
      description:
        "Review high-resolution rendered looks with our interactive Before/After comparison slider. Save looks to your wardrobe or generate alternative outfit combinations.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header Bar */}
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

      {/* Main Educational Content */}
      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full space-y-16">
        {/* Editorial Heading */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase block">
            Product Mechanics & AI Architecture
          </span>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
            How virtual fitting works
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            A restrained look at how V Try-On transforms silhouette photos into high-fashion drape visualizations through generative diffusion.
          </p>
        </div>

        {/* 4-Step Pipeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-muted-foreground">
                    <HugeiconsIcon icon={step.icon} className="size-5" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{step.num}</span>
                </div>
                <h3 className="text-base font-medium text-foreground tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Async Status Anatomy */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-surface-subtle space-y-4">
          <h2 className="text-lg font-medium text-foreground tracking-tight">
            Understanding Generation Statuses
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Virtual try-on synthesis is an asynchronous compute-intensive process. When you submit a look:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
              <span className="font-mono uppercase tracking-wider text-muted-foreground text-[10px] block">
                1. Waiting to start (queued)
              </span>
              <p className="text-muted-foreground">
                Your request is queued in Redis awaiting an available Celery GPU worker process.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
              <span className="font-mono uppercase tracking-wider text-foreground text-[10px] block font-medium">
                2. Creating your look (processing)
              </span>
              <p className="text-muted-foreground">
                Worker is performing diffusion garment warping and composite blend rendering.
              </p>
            </div>
          </div>
        </div>

        {/* Sizing Disclaimer & Privacy Banner */}
        <div className="p-6 rounded-2xl border border-border/80 bg-surface text-xs space-y-2 text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-medium block">
            Fit & Sizing Accuracy Notice:
          </strong>
          <p>
            V Try-On generates an editorial visual interpretation and is not a sizing or fit guarantee. Camera angle, lens perspective, and generative AI parameters simulate garment drape algorithmically.
          </p>
          <div className="pt-2">
            <Link
              to={ROUTES.privacy}
              className="text-foreground font-medium underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Read our full Privacy & Data Protection Policy →
            </Link>
          </div>
        </div>

        {/* Action CTA */}
        <div className="text-center pt-4">
          <Link to={isAuthenticated ? ROUTES.app.studio : ROUTES.auth.register}>
            <Button size="lg" className="gap-2 px-6">
              <span>{isAuthenticated ? "Open Fitting Studio" : "Start your try-on"}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
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
