import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { SectionShell } from "./section-shell"
import { SectionPattern } from "../patterns"

export function WhatItIsSection() {
  const whatItIs = [
    "A visual virtual try-on experience that places outfits onto your photo",
    "A creative tool to preview styles, cuts, and colors on your silhouette",
    "An asynchronous diffusion-based image synthesis pipeline",
    "A private authenticated workspace for your personal look collection",
    "A side-by-side comparison engine to evaluate different outfits",
  ]

  const whatItIsNot = [
    "A body measurement or anatomical tailoring tape measure",
    "A guarantee of real-world physical sizing or garment fit accuracy",
    "A flawless physics simulation of fabric stretch, stiffness, or weight",
    "A promise of 100% pixel-perfect identity preservation without artifacts",
    "A replacement for physically trying on garments before purchase",
  ]

  return (
    <SectionShell
      id="boundaries"
      sectionNumber="12"
      eyebrow="TRANSPARENT BOUNDARIES"
      title="Clear expectations before your first fitting."
      subtitle="We believe consumer trust comes from honesty about what generative models can and cannot deliver."
      className="relative"
    >
      <SectionPattern preset="comparison" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* What It Is */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 space-y-6">
          <div className="flex items-center gap-2 text-zinc-100 font-medium">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-5 h-5 text-emerald-400" />
            <span className="text-lg">What V Try-On Is</span>
          </div>

          <ul className="space-y-4 text-sm text-zinc-300">
            {whatItIs.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What It Is Not */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 space-y-6">
          <div className="flex items-center gap-2 text-zinc-100 font-medium">
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-zinc-400" />
            <span className="text-lg">What V Try-On Is Not</span>
          </div>

          <ul className="space-y-4 text-sm text-zinc-400">
            {whatItIsNot.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  )
}
