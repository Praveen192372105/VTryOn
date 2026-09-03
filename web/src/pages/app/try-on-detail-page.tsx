import { useParams, Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { useTryOnJob, ResultViewer } from "../../features/try-on"
import { buttonVariants } from "../../components/ui/button"
import { Spinner } from "../../components/ui/spinner"
import { ROUTES } from "../../app/route-paths"
import { cn } from "../../lib/utils"

export default function TryOnDetailPage() {
  const { id } = useParams<{ id: string }>()
  useDocumentTitle(`Look Detail`)
  const jobId = id || ""

  const { data: job, isLoading, error } = useTryOnJob(jobId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-4 border-b border-zinc-900">
        <Link
          to={ROUTES.history}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-zinc-400 hover:text-zinc-100")}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          <span>Back to history</span>
        </Link>
        <div className="border-l border-zinc-800 pl-4">
          <h1 className="text-lg font-medium text-zinc-100">Try-On Result</h1>
          <p className="text-xs text-zinc-500 font-mono">Job ID: {jobId}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="aspect-[3/4] max-w-md mx-auto rounded-lg border border-zinc-800 bg-zinc-950/60 flex flex-col items-center justify-center gap-3">
          <Spinner className="w-6 h-6 text-zinc-400" />
          <span className="text-xs text-zinc-500 font-mono">Fetching try-on job status...</span>
        </div>
      ) : error || !job ? (
        <div className="p-8 rounded-lg border border-red-900/40 bg-red-950/20 text-center text-red-300 text-sm max-w-md mx-auto">
          Unable to load try-on details. The job may have expired or does not exist.
        </div>
      ) : (
        <ResultViewer job={job} />
      )}
    </div>
  )
}
