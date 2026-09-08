import { useDocumentTitle } from "../../hooks/use-document-title"
import { PublicPolicyLayout } from "../../components/layout/public-policy-layout"

export default function TermsPage() {
  useDocumentTitle("Terms · V Try-On")

  return (
    <PublicPolicyLayout
      title="Terms of Service"
      subtitle="Usage guidelines, acceptable content responsibilities, and synthetic fitting disclaimers."
      lastUpdated="September 2026"
      activePage="terms"
    >
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-medium tracking-tight text-foreground">
          1. Service Description
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          V Try-On provides an AI-assisted virtual garment try-on platform that pairs uploaded silhouette photos with garment catalogue items to render synthetic drape visualizations. The platform is designed for style exploration and visual previews.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-medium tracking-tight text-foreground">
          2. No Sizing or Fit Guarantee
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          V Try-On generates an editorial visual interpretation and is not a sizing or fit guarantee. Due to variations in camera angles, lens distortion, lighting, and generative diffusion models, the digital drape may differ significantly from real-world garment measurements, stretch, and fabric hand.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-medium tracking-tight text-foreground">
          3. Uploaded Content Responsibilities
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You agree to upload only legitimate portrait photographs for which you possess full rights and consent. You are strictly prohibited from uploading:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
          <li>Photographs of minors.</li>
          <li>Explicit, obscene, or non-consensual imagery.</li>
          <li>Malicious payloads or modified file binaries designed to compromise server systems.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-medium tracking-tight text-foreground">
          4. Account Security and Availability
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You are responsible for safeguarding your login credentials. While we endeavor to maintain high platform availability, virtual try-on jobs are processed via asynchronous GPU worker queues and may occasionally experience queue latency or maintenance downtimes.
        </p>
      </section>
    </PublicPolicyLayout>
  )
}
