import { ImageFrame } from "../../../components/image/image-frame"
import { JobStatus } from "./job-status"
import type { TryOnJob } from "../types"

interface ResultViewerProps {
  job: TryOnJob
  className?: string
}

export function ResultViewer({ job, className }: ResultViewerProps) {
  return (
    <div className={className}>
      {job.status === "succeeded" && job.result_image_url ? (
        <div className="space-y-4">
          <ImageFrame
            src={job.result_image_url}
            alt="Virtual try-on result"
            aspectRatio="3/4"
            containerClassName="max-w-md mx-auto shadow-2xl border-zinc-700/80"
          />
          <JobStatus status="succeeded" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="aspect-[3/4] max-w-md mx-auto rounded-lg border border-zinc-800 bg-zinc-950/60 flex items-center justify-center p-8 text-center">
            <JobStatus status={job.status} errorMessage={job.error_message} />
          </div>
        </div>
      )}
    </div>
  )
}
