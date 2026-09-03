import { SectionShell } from "./section-shell"
import { PrivacyFlowSvg } from "../illustrations/privacy-flow-svg"
import { SectionPattern } from "../patterns"

export function PrivacySection() {
  const commitments = [
    {
      title: "Account-Level Isolation",
      desc: "Uploaded portraits are assigned exclusively to your authenticated user ID. Other users cannot discover or access your images.",
    },
    {
      title: "EXIF & Metadata Stripping",
      desc: "All personal photo metadata—including GPS geolocation, camera serials, and timestamp tags—is purged during intake validation.",
    },
    {
      title: "Worker Artifact Cleanup",
      desc: "Temporary intermediate masks, warping files, and cropped diffusion caches on worker machines are wiped once synthesis completes.",
    },
    {
      title: "Immediate Deletion Control",
      desc: "You retain full control over your media. Deleting a photo from your gallery permanently purges it from our storage disks.",
    },
  ]

  return (
    <SectionShell
      id="privacy"
      sectionNumber="09"
      eyebrow="PRIVACY & PERSONAL MEDIA"
      title="Your photo is personal. The product should treat it that way."
      subtitle="We do not harvest user silhouettes or sell uploaded portraits to third-party data brokers. Your images exist solely to render your requested fittings."
      className="relative"
    >
      <SectionPattern preset="privacy" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Visual (45%) */}
        <div className="lg:col-span-6 flex justify-center">
          <PrivacyFlowSvg />
        </div>

        {/* Right Commitments (55%) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {commitments.map((c, i) => (
            <div key={i} className="p-5 rounded-xl border border-zinc-800/70 bg-zinc-950/50 space-y-2">
              <h3 className="text-sm font-medium text-zinc-100">{c.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
