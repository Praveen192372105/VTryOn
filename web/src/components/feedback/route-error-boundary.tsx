import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, RefreshIcon, Home01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/app/route-paths"

export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  let title = "Something went wrong"
  let message = "An unexpected error occurred while loading this view."
  let statusText: string | null = null

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`
    message = error.data?.message || error.statusText || message
    statusText = `${error.status} ${error.statusText}`
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs text-center space-y-5">
        <div className="mx-auto size-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
          <HugeiconsIcon icon={Alert02Icon} className="size-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{message}</p>
          {statusText && <span className="inline-block text-[11px] font-mono text-muted-foreground/80">{statusText}</span>}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            <HugeiconsIcon icon={RefreshIcon} className="size-3.5 mr-1.5" />
            Reload Page
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(ROUTES.app.studio)}
            className="w-full sm:w-auto"
          >
            <HugeiconsIcon icon={Home01Icon} className="size-3.5 mr-1.5" />
            Go to Studio
          </Button>
        </div>
      </div>
    </div>
  )
}
