import { useNavigate } from "react-router-dom"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { TryOnComposer } from "../../features/try-on"
import { ROUTES } from "../../app/route-paths"
import type { TryOnJob } from "../../features/try-on"

export default function StudioPage() {
  useDocumentTitle("Fitting Studio")
  const navigate = useNavigate()

  const handleJobCreated = (job: TryOnJob) => {
    navigate(ROUTES.tryOnDetail(job.id))
  }

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div className="pb-4 border-b border-zinc-900">
        <h1 className="text-2xl font-light tracking-tight text-zinc-100">Fitting Studio</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Combine your uploaded portrait with any catalogue outfit to render a photorealistic virtual try-on.
        </p>
      </div>

      {/* Interactive Try-On Composer */}
      <TryOnComposer onJobCreated={handleJobCreated} />
    </div>
  )
}
