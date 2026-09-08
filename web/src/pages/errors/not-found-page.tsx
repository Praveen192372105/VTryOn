import { Link } from "react-router-dom"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { useAuth } from "../../features/auth"
import { ROUTES } from "../../app/route-paths"
import { Button } from "../../components/ui/button"

export default function NotFoundPage() {
  useDocumentTitle("Page Not Found · V Try-On")
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
      <div className="space-y-4 max-w-md">
        <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
          404 — Not Found
        </span>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
          This look does not exist
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          The page you requested could not be located in our fitting room catalogue.
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link to={isAuthenticated ? ROUTES.app.studio : ROUTES.home}>
            <Button size="sm">
              {isAuthenticated ? "Open fitting studio" : "Go to home"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
