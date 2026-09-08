import { useDocumentTitle } from "../../hooks/use-document-title"
import { PublicPolicyLayout } from "../../components/layout/public-policy-layout"

export default function PrivacyPage() {
  useDocumentTitle("Privacy · V Try-On")

  return (
    <PublicPolicyLayout
      title="Privacy Policy"
      subtitle="How V Try-On handles your silhouette uploads, fitting data, and AI generation assets."
      lastUpdated="September 2026"
      activePage="privacy"
    >
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-medium tracking-tight text-foreground">
          1. Information We Collect and Process
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          When you use V Try-On, we collect the minimum information required to deliver virtual garment synthesis:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
          <li>
            <strong className="text-foreground font-medium">Account Credentials:</strong> Your name, email address, and encrypted authentication tokens.
          </li>
          <li>
            <strong className="text-foreground font-medium">Silhouette & Portrait Uploads:</strong> Photos uploaded by you specifically for garment fitting analysis and drape alignment.
          </li>
          <li>
            <strong className="text-foreground font-medium">Virtual Fitting Records:</strong> References to selected catalogue garments, synthetic generation results, job timestamps, and status metadata.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-medium tracking-tight text-foreground">
          2. How AI Synthesis Works
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Uploaded portraits are passed to our dedicated diffusion pipeline (CatVTON) to warp, drape, and composite selected garments onto your silhouette. Processing is isolated on private GPU worker processes and results are written directly to your private account record.
        </p>
        <div className="p-4 rounded-xl bg-surface-subtle border border-border text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground block mb-1">Fit & Sizing Notice:</strong>
          V Try-On generates an editorial visual interpretation and is not a sizing or tailoring guarantee. Garment drape and tension are simulated algorithmically and may differ from physical in-person garments.
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-medium tracking-tight text-foreground">
          3. Media Isolation and User Deletion
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          All uploaded portraits and generated looks are user-scoped. Photos uploaded under your account are never visible to other users. You retain full control over your media: when you delete a portrait photo from your account, both the database reference and local storage file are permanently deleted.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-medium tracking-tight text-foreground">
          4. Zero Third-Party Tracking
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          V Try-On does not include third-party advertising trackers, data brokers, or marketing pixels. Authentication session tokens are stored securely in local browser storage and communicated solely via HTTPS/HTTP bearer headers to our API backend.
        </p>
      </section>
    </PublicPolicyLayout>
  )
}
