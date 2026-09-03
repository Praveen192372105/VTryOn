import { SectionShell } from "./section-shell"
import { SectionPattern } from "../patterns"

export function AsyncUxSection() {
  const steps = [
    {
      num: "01",
      title: "Submit and Continue",
      desc: "Trigger a virtual try-on and immediately browse new outfits or manage portraits. The application never locks your screen.",
    },
    {
      num: "02",
      title: "State Survives Navigation",
      desc: "Close your browser tab or switch to your mobile device. Because job statuses are persisted in the database, progress is never lost.",
    },
    {
      num: "03",
      title: "Return When Ready",
      desc: "Your fitting result appears directly in your History panel as soon as worker synthesis concludes.",
    },
  ]

  return (
    <SectionShell
      id="async-ux"
      sectionNumber="10"
      eyebrow="ASYNC ARCHITECTURE"
      title="Generation takes time. The interface is designed for that."
      subtitle="High-precision diffusion rendering requires real computational work. We designed an interface that respects your time rather than holding your browser hostage."
      className="relative"
    >
      <SectionPattern preset="async" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-4">
        {steps.map((st) => (
          <div
            key={st.num}
            className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 space-y-4"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-xs text-zinc-300">
              {st.num}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-medium text-zinc-100">{st.title}</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{st.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
