import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon, Loading03Icon, AlertCircleIcon } from "@hugeicons/core-free-icons"
import { Button } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"

export interface GenerateBarProps {
  canGenerate: boolean
  isSubmitting: boolean
  isCountingDown?: boolean
  secondsLeft?: number
  hasPerson: boolean
  hasOutfit: boolean
  errorMessage?: string | null
  requestId?: string | null
  onSubmit: (e: React.FormEvent) => void
  className?: string
}

export function GenerateBar({
  canGenerate,
  isSubmitting,
  isCountingDown,
  secondsLeft,
  hasPerson,
  hasOutfit,
  errorMessage,
  requestId,
  onSubmit,
  className,
}: GenerateBarProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4",
        className
      )}
    >
      <div className="flex-1 text-center sm:text-left">
        {errorMessage ? (
          <div className="flex items-center gap-2 text-destructive text-sm" role="alert">
            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
            <span>
              {errorMessage}
              {requestId && (
                <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                  (Ref: {requestId})
                </span>
              )}
            </span>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-foreground">Ready to create your look</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {!hasPerson && !hasOutfit
                ? "Select a model photo and an outfit from the catalogue above."
                : !hasPerson
                ? "Select a model photo to pair with your chosen outfit."
                : !hasOutfit
                ? "Select an outfit to pair with your model photo."
                : "Both selections confirmed. Click generate to start fitting."}
            </p>
          </div>
        )}
      </div>

      <Button
        type="button"
        size="lg"
        disabled={!canGenerate}
        onClick={onSubmit}
        className="w-full sm:w-auto min-w-[200px] h-12 text-sm font-medium shadow-sm transition-all"
      >
        {isSubmitting ? (
          <>
            <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin mr-2" />
            Starting your try-on…
          </>
        ) : isCountingDown ? (
          `Wait ${secondsLeft}s…`
        ) : (
          <>
            <HugeiconsIcon icon={SparklesIcon} size={18} className="mr-2 text-amber-300" />
            Generate Try-On
          </>
        )}
      </Button>
    </div>
  )
}
