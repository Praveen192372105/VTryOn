import { SectionShell } from "./section-shell"
import { IdentityLockSvg } from "../illustrations/identity-lock-svg"
import { SectionPattern } from "../patterns"

export function IdentitySection() {
  return (
    <SectionShell
      id="identity"
      sectionNumber="05"
      eyebrow="IDENTITY PHILOSOPHY"
      title="The goal is to change the garment, not who you are."
      subtitle="True virtual fitting requires surgical precision: isolating the fabric layer while leaving your anatomical identity intact."
      className="relative"
    >
      <SectionPattern preset="identity" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Copy (60%) */}
        <div className="lg:col-span-7 space-y-6 text-zinc-400 text-sm sm:text-base leading-relaxed">
          <p>
            Generative AI often tends to rewrite entire images, modifying facial traits, skin tones, or postures. We believe that is the exact opposite of what a virtual fitting room should do.
          </p>

          <p>
            Our architecture creates strict segmentation masks that deliberately constrain the diffusion model. The algorithm is permitted to modify <span className="text-zinc-100 font-medium">only the garment region</span>, while protecting your face, hair, body geometry, and surrounding environment.
          </p>

          {/* Honest Technical Limitation Callout */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-2">
            <span className="text-[11px] font-mono tracking-wider text-zinc-300 uppercase block font-medium">
              Technical Note // Generative Boundaries
            </span>
            <p className="text-xs text-zinc-400 leading-normal">
              Generative models can still introduce visual differences, especially around complex hand placements, hair overlaps, deep shadows, or high-contrast background edges. We continuously refine our masks to minimize these artifacts.
            </p>
          </div>
        </div>

        {/* Right Illustration (40%) */}
        <div className="lg:col-span-5 flex justify-center">
          <IdentityLockSvg />
        </div>
      </div>
    </SectionShell>
  )
}
