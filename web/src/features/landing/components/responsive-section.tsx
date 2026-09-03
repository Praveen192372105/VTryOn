import { SectionShell } from "./section-shell"
import { DeviceSystemSvg } from "../illustrations/device-system-svg"
import { SectionPattern } from "../patterns"

export function ResponsiveSection() {
  return (
    <SectionShell
      id="responsive"
      sectionNumber="11"
      eyebrow="RESPONSIVE CRAFT"
      title="Crafted for desktop precision and mobile touch."
      subtitle="Whether you are fitting garments on a wide studio monitor or testing looks on the go with your phone, the interface reorganizes fluidly to match your device."
      align="center"
      className="relative"
    >
      <SectionPattern preset="devices" />

      <div className="pt-2">
        <DeviceSystemSvg />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8 text-left">
        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-1">
          <p className="text-xs font-mono text-zinc-300 uppercase">01 / Mobile Touch</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Sequential wizard workflow with bottom navigation tabs and full-width thumb-friendly controls.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-1">
          <p className="text-xs font-mono text-zinc-300 uppercase">02 / Tablet Layout</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Balanced dual-pane studio placing the portrait canvas directly beside garment catalogue filters.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-1">
          <p className="text-xs font-mono text-zinc-300 uppercase">03 / Desktop Studio</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Expansive workspace supporting high-resolution image inspection and full keyboard navigation.
          </p>
        </div>
      </div>
    </SectionShell>
  )
}
