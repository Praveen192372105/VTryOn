import { SectionShell } from "./section-shell"
import { ThesisGridSvg } from "../illustrations/thesis-grid-svg"
import { SectionPattern } from "../patterns"

export function ProductThesisSection() {
  return (
    <SectionShell
      id="thesis"
      sectionNumber="02"
      eyebrow="PRODUCT THESIS"
      title="A fitting room that begins with your photo, not a generic model."
      className="relative"
    >
      <SectionPattern preset="thesis" />
      <ThesisGridSvg />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 pt-4 text-zinc-400 text-base sm:text-lg leading-relaxed font-normal">
        <div className="space-y-6">
          <p>
            Traditional e-commerce forces you to imagine clothing on your body by looking at professional studio models whose heights, proportions, and postures rarely reflect your own.
          </p>
          <p>
            V Try-On flips the paradigm: instead of asking you to conform to a catalogue model, we take your natural silhouette as the foundation and project the selected garment onto you.
          </p>
        </div>

        <div className="space-y-6">
          <p>
            By combining anatomical body parsing with diffusion-based garment synthesis, our engine maps the contours, fabric drape, and lighting of garments directly onto your portrait.
          </p>
          <p className="text-zinc-300 font-medium border-l-2 border-zinc-700 pl-4">
            We focus on preserving who you are—your facial identity, hairstyle, and posture—while transforming only the clothing you wish to explore.
          </p>
        </div>
      </div>
    </SectionShell>
  )
}
