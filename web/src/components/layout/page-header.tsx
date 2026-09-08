import React from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { cn } from "../../lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  onBack?: () => void
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  onBack,
  actions,
  breadcrumb,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-5 border-b border-border/80 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="space-y-1.5 min-w-0">
        {/* Optional Breadcrumb or Back Button */}
        {breadcrumb ? (
          <div className="mb-2">{breadcrumb}</div>
        ) : backHref ? (
          <Link
            to={backHref}
            className="inline-flex items-center gap-1 text-xs font-mono tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors mb-1.5 group"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{backLabel}</span>
          </Link>
        ) : onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-mono tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors mb-1.5 group cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{backLabel}</span>
          </button>
        ) : null}

        <h1 className="text-xl sm:text-2xl font-light tracking-tight text-foreground truncate">
          {title}
        </h1>

        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}
