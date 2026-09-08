import { useDocumentTitle } from "../../hooks/use-document-title"
import { AccountProfile } from "../../features/account"
import { PageHeader } from "../../components/layout"

export default function SettingsPage() {
  useDocumentTitle("Account Settings")

  return (
    <div className="w-full max-w-3xl mx-auto py-2 sm:py-6 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Account & Settings"
        description="Manage your account profile, theme preferences, and active session."
      />

      <AccountProfile />
    </div>
  )
}

