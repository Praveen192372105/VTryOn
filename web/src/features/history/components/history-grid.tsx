import { Link } from "react-router-dom"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { useHistory } from "../hooks/use-history"
import { ImageFrame } from "../../../components/image/image-frame"
import { EmptyState } from "../../../components/feedback/empty-state"
import { ROUTES } from "../../../app/route-paths"
import { buttonVariants } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"

export function HistoryGrid() {
  const { data, isLoading } = useHistory()
  const jobs = data?.items || []

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-lg bg-zinc-900/50 animate-pulse border border-zinc-800/40" />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Clock01Icon}
        title="No try-on history yet"
        description="Your generated fitting looks will appear here. Create your first look in the studio."
        action={
          <Link
            to={ROUTES.studio}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-zinc-800 text-zinc-300")}
          >
            Open fitting studio
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {jobs.map((job) => (
        <Link
          key={job.id}
          to={ROUTES.tryOnDetail(job.id)}
          className="group block rounded-lg overflow-hidden border border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700 transition-all"
        >
          <ImageFrame
            src={job.result_image_url || undefined}
            alt="Try-on generation"
            aspectRatio="3/4"
            fallbackText={job.status}
          />
          <div className="p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="capitalize font-medium text-zinc-300">{job.status}</span>
              <span className="text-zinc-500 font-mono text-[10px]">
                {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
