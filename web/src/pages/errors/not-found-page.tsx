import { Link } from "react-router-dom"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { useAuth } from "../../features/auth"
import { ROUTES } from "../../app/route-paths"
import { buttonVariants } from "../../components/ui/button"
import { cn } from "../../lib/utils"

export default function NotFoundPage() {
  useDocumentTitle("Page Not Found")
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-zinc-100 p-6 text-center">
      <div className="space-y-4 max-w-md">
        <span className="text-xs font-mono tracking-widest text-zinc-600 uppercase">
          404 — Not Found
        </span>
        <h1 className="text-4xl font-light tracking-tight text-zinc-100">
          This look does not exist
        </h1>
        <p className="text-sm text-zinc-400">
          The page you requested could not be located in our fitting room catalogue.
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            to={isAuthenticated ? ROUTES.studio : ROUTES.home}
            className={cn(buttonVariants({ size: "sm" }), "bg-zinc-100 text-zinc-950 hover:bg-white font-medium")}
          >
            {isAuthenticated ? "Open fitting studio" : "Go to home"}
          </Link>
        </div>
      </div>
    </div>
  )
}
