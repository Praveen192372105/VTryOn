import { useNavigate } from "react-router-dom"
import { useDocumentTitle } from "../../hooks/use-document-title"
import { TryOnComposer } from "../../features/try-on"
import { PageHeader } from "../../components/layout"
import { ROUTES } from "../../app/route-paths"
import type { TryOnJob } from "../../features/try-on"

export default function StudioPage() {
  useDocumentTitle("Studio")
  const navigate = useNavigate()

  const handleJobCreated = (job: TryOnJob) => {
    navigate(ROUTES.app.tryOnDetail(job.id))
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="Studio"
        description="Choose your photo and an outfit to create a virtual try-on."
      />

      {/* Interactive Virtual Try-On Composer */}
      <TryOnComposer onJobCreated={handleJobCreated} />
    </div>
  )
}
