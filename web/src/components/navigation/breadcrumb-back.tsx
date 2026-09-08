import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

export interface BreadcrumbBackProps {
  label?: string
  fallbackTo?: string
  className?: string
}

export function BreadcrumbBack({
  label = "Back",
  fallbackTo = "/app/studio",
  className,
}: BreadcrumbBackProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallbackTo)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn("h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground", className)}
      aria-label={`Go back to previous page: ${label}`}
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
      <span>{label}</span>
    </Button>
  )
}
