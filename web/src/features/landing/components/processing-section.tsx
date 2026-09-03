import { SectionShell } from "./section-shell"
import { AsyncStatesSvg } from "../illustrations/async-states-svg"
import { SectionPattern } from "../patterns"

export function ProcessingSection() {
  return (
    <SectionShell
      id="processing"
      sectionNumber="07"
      eyebrow="ASYNC INTEGRITY"
      title="No fake progress bars. We show what is actually happening."
      subtitle="Most AI applications display artificial timers or fake percentage numbers (37%, 74%) while waiting. We believe in complete operational honesty."
      className="relative"
    >
      <SectionPattern preset="processing" />

      <div className="pt-2">
        <AsyncStatesSvg />
      </div>

      <div className="mt-8 p-6 rounded-xl border border-zinc-800/80 bg-zinc-950/40 text-xs text-zinc-400 leading-relaxed max-w-3xl">
        <span className="font-mono text-zinc-200 uppercase tracking-wider block mb-1">
          Architectural Transparency
        </span>
        When hardware resources are occupied, jobs stay transparently queued. Once assigned to a worker, diffusion iterations run without fabricated progress metrics. If an error occurs, we give you a concrete reference code instead of spinning indefinitely.
      </div>
    </SectionShell>
  )
}
