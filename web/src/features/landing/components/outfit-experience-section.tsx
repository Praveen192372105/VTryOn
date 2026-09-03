import { SectionShell } from "./section-shell"
import { GarmentRailSvg } from "../illustrations/garment-rail-svg"
import { SectionPattern } from "../patterns"

export function OutfitExperienceSection() {
  return (
    <SectionShell
      id="catalogue"
      sectionNumber="06"
      eyebrow="CATALOGUE BROWSING"
      title="Curated silhouettes ready for transfer."
      subtitle="Select from tailored shirts, evening dresses, structured coats, and trousers formatted specifically for diffusion fitting."
      align="center"
      className="relative"
    >
      <SectionPattern preset="outfits" />

      <div className="pt-2">
        <GarmentRailSvg />
      </div>

      <div className="max-w-2xl mx-auto text-center mt-6 text-xs sm:text-sm text-zinc-500 font-mono">
        * Garments are digitally catalogued with precise alpha contours to ensure clean drape lines across diverse body shapes.
      </div>
    </SectionShell>
  )
}
