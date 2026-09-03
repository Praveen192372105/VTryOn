import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon, Shirt01Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { SectionShell } from "./section-shell"
import { SectionPattern } from "../patterns"

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Add your photo",
      desc: "Upload a clean portrait or full-body photo. Neutral lighting and natural posture produce the highest transfer fidelity.",
      icon: Camera01Icon,
      sub: "Anatomical mask generation",
    },
    {
      num: "02",
      title: "Choose an outfit",
      desc: "Browse curated collections of shirts, dresses, coats, and jackets. Select the exact garment you wish to preview.",
      icon: Shirt01Icon,
      sub: "Curated vector garment catalogue",
    },
    {
      num: "03",
      title: "Generate your look",
      desc: "Submit your request to our GPU processing queue. Receive a photorealistic synthesis rendered directly to your silhouette.",
      icon: SparklesIcon,
      sub: "Neural diffusion fitting",
    },
  ]

  return (
    <SectionShell
      id="how-it-works"
      sectionNumber="03"
      eyebrow="INTERACTION ARCHITECTURE"
      title="Three deliberate steps to a new silhouette."
      subtitle="No complicated prompt engineering or manual measuring tapes. A streamlined, three-phase fitting workflow."
      className="relative"
    >
      <SectionPattern preset="how-it-works" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {steps.map((st) => (
          <div
            key={st.num}
            className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-8 flex flex-col justify-between space-y-6 hover:border-zinc-700/80 transition-colors"
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 group-hover:text-white transition-colors">
                <HugeiconsIcon icon={st.icon} className="w-6 h-6" />
              </div>
              <span className="text-2xl font-light font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">
                {st.num}
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-zinc-100">{st.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                {st.desc}
              </p>
            </div>

            {/* Bottom Meta */}
            <div className="pt-4 border-t border-zinc-900/80 text-[11px] font-mono text-zinc-500">
              {st.sub}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
