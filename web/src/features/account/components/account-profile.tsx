import { useAuth } from "../../auth"
import { Button } from "../../../components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon, Logout01Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons"

export function AccountProfile() {
  const { user, logout } = useAuth()

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <HugeiconsIcon icon={UserIcon} className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-medium text-white">{user?.name || "User"}</h2>
            <p className="text-xs text-zinc-400 font-mono">{user?.email}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-900 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Account ID</span>
            <span className="text-zinc-200 font-mono text-[11px]">{user?.id}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Privacy Status</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <HugeiconsIcon icon={SecurityCheckIcon} className="w-3.5 h-3.5" />
              <span>Isolated & Protected</span>
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-900 flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => logout()}
            className="gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={Logout01Icon} className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
