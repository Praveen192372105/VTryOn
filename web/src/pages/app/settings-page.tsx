import { useDocumentTitle } from "../../hooks/use-document-title"
import { AccountProfile } from "../../features/account"

export default function SettingsPage() {
  useDocumentTitle("Account Settings")

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-zinc-900">
        <h1 className="text-2xl font-light tracking-tight text-zinc-100">Account Settings</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Manage your account profile, security credentials, and active session.
        </p>
      </div>

      <AccountProfile />
    </div>
  )
}
