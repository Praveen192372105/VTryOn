import { cn } from "../../../lib/utils"
import type { TryOnJob } from "../types"

export interface ResultMetaProps {
  job: TryOnJob
  outfitName?: string | null
  className?: string
}

export function ResultMeta({ job, outfitName, className }: ResultMetaProps) {
  const dateStr =
    job.finished_at || job.completed_at
      ? new Date(job.finished_at || job.completed_at!).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Just now"

  return (
    <div className={cn("flex flex-col sm:flex-row lg:flex-col justify-between gap-2 border-b border-border/60 pb-4", className)}>
      <div>
        <h2 className="text-base font-semibold text-foreground">Your look is ready</h2>
        {outfitName && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Fitted with <span className="text-foreground font-medium">{outfitName}</span>
          </p>
        )}
      </div>
      <div className="text-[11px] font-mono text-muted-foreground">{dateStr}</div>
    </div>
  )
}
