import { HugeiconsIcon } from "@hugeicons/react"
import { Shield01Icon, LockKeyIcon, SecurityCheckIcon } from "@hugeicons/core-free-icons"

export function PrivacyFlowSvg() {
  return (
    <div
      role="img"
      aria-label="Architectural diagram showing isolated authenticated storage, metadata scrubbing, and private processing perimeter"
      className="w-full max-w-lg mx-auto aspect-[16/10] rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 flex flex-col justify-between select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Shield01Icon} className="w-4 h-4 text-zinc-300" />
          <span className="text-xs font-medium text-zinc-200">Private Isolation Perimeter</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2 py-0.5 rounded">
          ENFORCED
        </span>
      </div>

      {/* Center Architecture Visual */}
      <div className="grid grid-cols-3 gap-3 my-auto items-center text-center">
        {/* Step 1: User Portrait */}
        <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-2">
          <div className="mx-auto w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <HugeiconsIcon icon={LockKeyIcon} className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] font-medium text-zinc-200">Account Vault</p>
          <p className="text-[9px] font-mono text-zinc-500">EXIF Stripped</p>
        </div>

        {/* Step 2: Processing Pipe */}
        <div className="relative py-2 flex flex-col items-center">
          <div className="w-full h-0.5 bg-zinc-800 relative">
            <div className="absolute inset-0 bg-zinc-400 opacity-60" />
          </div>
          <span className="text-[9px] font-mono text-zinc-400 mt-2 px-1.5 py-0.5 bg-zinc-900 rounded border border-zinc-800">
            OWNER_AUTH
          </span>
        </div>

        {/* Step 3: Private Result */}
        <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-2">
          <div className="mx-auto w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <HugeiconsIcon icon={SecurityCheckIcon} className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] font-medium text-zinc-200">Restricted Result</p>
          <p className="text-[9px] font-mono text-zinc-500">Owner-Only Access</p>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="pt-3 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
        <span>ARTIFACT_LIFECYCLE: CLEANED</span>
        <span>NO_CROSS_TENANT_ACCESS</span>
      </div>
    </div>
  )
}
