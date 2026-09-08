import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { ROUTES } from "../../app/route-paths"
import { Button } from "../../components/ui/button"

export default function ProtectedNotFoundPage() {
  useDocumentTitle("Page Not Found · V Try-On")

  return (
    <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto space-y-5">
      <div className="size-12 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center text-muted-foreground shadow-2xs">
        <HugeiconsIcon icon={Search01Icon} className="size-6" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Workspace Error · 404
        </span>
        <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
          Section not found
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          The workspace section or record you attempted to access does not exist or may have been relocated.
        </p>
      </div>

      <div className="pt-2">
        <Link to={ROUTES.app.studio}>
          <Button size="sm" className="gap-2">
            <span>Return to Studio</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
