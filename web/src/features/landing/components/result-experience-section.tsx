import { SectionShell } from "./section-shell"
import { ResultCompareSvg } from "../illustrations/result-compare-svg"
import { SectionPattern } from "../patterns"

export function ResultExperienceSection() {
  return (
    <SectionShell
      id="results"
      sectionNumber="08"
      eyebrow="RESULT STUDIO"
      title="Inspect every detail with clarity."
      subtitle="Examine your generated looks in high resolution. Compare your original portrait against the fitted outcome with side-by-side precision."
      className="relative"
    >
      <SectionPattern preset="result" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Visual (45%) */}
        <div className="lg:col-span-6 flex justify-center">
          <ResultCompareSvg />
        </div>

        {/* Right Details (55%) */}
        <div className="lg:col-span-6 space-y-6 text-zinc-400 text-sm sm:text-base leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-zinc-100">Direct Comparison</h3>
            <p>
              Slide seamlessly between your raw photo and the fitted result. Verify how fabric drape aligns around collar lines, cuffs, and natural body seams.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-zinc-100">Permanent Session History</h3>
            <p>
              Every generated look is archived in your personal wardrobe history. Revisit previous garment combinations without having to re-upload photos or re-run jobs.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-zinc-100">High-Resolution Canvas</h3>
            <p>
              Rendered at 768 × 1024 resolution to preserve intricate textile patterns, button plackets, and stitch textures clearly.
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
