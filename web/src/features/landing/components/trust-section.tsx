import { SectionShell } from "./section-shell"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../../../components/ui/accordion"
import { SectionPattern } from "../patterns"

export function TrustSection() {
  const faqs = [
    {
      q: "How accurate is the generated try-on result?",
      a: "The result is an AI-generated visual interpretation designed to show garment style, silhouette matching, and fabric drape on your body. Quality varies based on the clarity of your photo, garment geometry, pose complexity, and lighting.",
    },
    {
      q: "Does V Try-On predict real-world sizing or fit?",
      a: "No. V Try-On is strictly a visual visualization tool. It does not measure physical body inches, suggest clothing sizes (S/M/L), or guarantee that a physical garment will fit comfortably in reality.",
    },
    {
      q: "What happens if a generation request fails?",
      a: "If the worker encounters an error during mask creation or model inference, the system updates the job status to 'failed' with a traceable reference ID. We never display endless spinning spinners or fake successes.",
    },
    {
      q: "How are my uploaded portraits stored and secured?",
      a: "Uploaded portraits and try-on results are tied exclusively to your authenticated user account. Personal image metadata (EXIF/GPS) is stripped upon upload, and you can delete your photos at any time from your account.",
    },
  ]

  return (
    <SectionShell
      id="trust"
      sectionNumber="13"
      eyebrow="TRUST & COMMITMENT"
      title="Useful because it is honest about what it can do."
      subtitle="We do not make inflated promises about artificial intelligence. We focus on reliable architecture, privacy, and transparent generative boundaries."
      className="relative"
    >
      <SectionPattern preset="trust" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-2">
        {/* Left Column: 4 Commitment Pillars */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 space-y-1.5">
            <h3 className="text-sm font-medium text-zinc-100">01 / Truthful States</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No artificial progress timers. Real status transitions based strictly on server events.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 space-y-1.5">
            <h3 className="text-sm font-medium text-zinc-100">02 / Private by Design</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero public galleries. Uploaded portraits are restricted exclusively to the account owner.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 space-y-1.5">
            <h3 className="text-sm font-medium text-zinc-100">03 / Generative Boundaries</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Transparent acknowledgement of diffusion artifacts, complex poses, and edge cases.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 space-y-1.5">
            <h3 className="text-sm font-medium text-zinc-100">04 / Permanent User Control</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              You retain full rights to delete your portraits and generated looks from our storage at any time.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Accordion */}
        <div className="lg:col-span-7">
          <Accordion className="border-zinc-800 divide-y divide-zinc-800/60 rounded-xl border bg-zinc-950/40">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-zinc-800/80 px-6">
                <AccordionTrigger className="text-sm sm:text-base font-medium text-zinc-200 hover:text-white py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-zinc-400 leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </SectionShell>
  )
}
