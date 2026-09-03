import { SectionShell } from "./section-shell"
import { FlowDiagramSvg } from "../illustrations/flow-diagram-svg"
import { SectionPattern } from "../patterns"

export function TryOnFlowSection() {
  return (
    <SectionShell
      id="experience"
      sectionNumber="04"
      eyebrow="SYSTEM FLOW"
      title="The journey from upload to generation."
      subtitle="Behind every fitted portrait lies a reliable, asynchronous pipeline built for transparent progress."
      className="relative"
    >
      <SectionPattern preset="flow" />

      {/* Horizontal Vector Pipeline Visual */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-10 mb-8">
        <FlowDiagramSvg />
      </div>

      {/* Narrative Pipeline Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-zinc-400">
        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-1.5">
          <p className="font-mono text-zinc-200 uppercase tracking-wider text-[11px]">
            Phase 1 // Input Validation
          </p>
          <p>
            Your photo is validated for dimensions, aspect ratio, and human presence. Security checks strip metadata and isolate the image within your account.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-1.5">
          <p className="font-mono text-zinc-200 uppercase tracking-wider text-[11px]">
            Phase 2 // Asynchronous Queue
          </p>
          <p>
            Requests are handed off to dedicated GPU worker processes. Your session is never blocked or frozen—you can safely browse while generation proceeds.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-1.5">
          <p className="font-mono text-zinc-200 uppercase tracking-wider text-[11px]">
            Phase 3 // Verification & Result
          </p>
          <p>
            Once the diffusion model completes garment transfer, the final high-resolution render is stored privately and made available in your fitting history.
          </p>
        </div>
      </div>
    </SectionShell>
  )
}
