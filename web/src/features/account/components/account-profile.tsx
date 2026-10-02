import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  ComputerIcon,
  Logout01Icon,
  Moon02Icon,
  SecurityCheckIcon,
  Sun01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/features/auth"
import { Button } from "@/components/ui/button"
import { useTheme, type Theme } from "@/lib/theme/theme-provider"
import { cn } from "@/lib/utils"

const themeOptions: {
  value: Theme
  title: string
  description: string
  icon: typeof Moon02Icon
}[] = [
  { value: "light", title: "Light", description: "Warm and bright", icon: Sun01Icon },
  { value: "dark", title: "Dark", description: "Soft and focused", icon: Moon02Icon },
  { value: "system", title: "System", description: "Match your device", icon: ComputerIcon },
]

function getInitials(name?: string) {
  if (!name?.trim()) return "U"
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be unavailable outside a secure browser context.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : label}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
    >
      {copied ? (
        <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" aria-hidden="true" />
      ) : (
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

function ThemePreview({ value }: { value: Theme }) {
  const light = (
    <div className="flex h-full flex-1 flex-col justify-between bg-[#f7f5ef] p-2.5">
      <div className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#a77a57]" /><span className="h-1.5 w-11 rounded-sm bg-[#ddd5c9]" /></div>
      <div className="space-y-1"><div className="h-1.5 w-18 rounded-sm bg-[#b8a898]" /><div className="h-1 w-12 rounded-sm bg-[#ddd5c9]" /></div>
    </div>
  )
  const dark = (
    <div className="flex h-full flex-1 flex-col justify-between bg-[#211e1b] p-2.5">
      <div className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#d3a77f]" /><span className="h-1.5 w-11 rounded-sm bg-[#4d4239]" /></div>
      <div className="space-y-1"><div className="h-1.5 w-18 rounded-sm bg-[#786457]" /><div className="h-1 w-12 rounded-sm bg-[#4d4239]" /></div>
    </div>
  )

  return (
    <div className="flex h-20 overflow-hidden rounded-md border border-border/80 shadow-xs" aria-hidden="true">
      {value === "system" ? <>{light}{dark}</> : value === "dark" ? dark : light}
    </div>
  )
}

export function AccountProfile() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs" aria-labelledby="profile-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-brand-soft/45 px-5 py-4 sm:px-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Your profile</span>
          <span className="inline-flex items-center gap-2 rounded-md border border-success/25 bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground">
            <span className="size-1.5 rounded-full bg-success" /> Active Account
          </span>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex size-17 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand-soft text-xl font-semibold text-brand sm:size-20 sm:text-2xl" aria-hidden="true">
              {user?.name ? getInitials(user.name) : <HugeiconsIcon icon={UserIcon} className="size-7" />}
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Personal fitting room</p>
              <h2 id="profile-heading" className="break-words font-editorial text-[clamp(1.9rem,3vw,2.6rem)] leading-tight tracking-[-0.045em] text-foreground">
                {user?.name || "Your account"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Manage your details and your workspace preferences.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t border-border pt-6 sm:grid-cols-2 sm:gap-7">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Email address</span>
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <span className="min-w-0 break-all text-sm text-foreground">{user?.email || "No email available"}</span>
                {user?.email && <CopyButton text={user.email} label="Copy email" />}
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Account ID</span>
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <span className="min-w-0 truncate font-mono text-xs text-foreground" title={user?.id || undefined}>{user?.id || "Unavailable"}</span>
                {user?.id && <CopyButton text={user.id} label="Copy user ID" />}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 border-t border-border bg-surface-subtle/60 px-5 py-4 sm:px-8">
          <HugeiconsIcon icon={SecurityCheckIcon} className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold text-foreground">Isolated &amp; Private</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Your photos and saved looks are associated with your account.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-8" aria-labelledby="appearance-heading">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Appearance</span>
        <h3 id="appearance-heading" className="mt-2 font-editorial text-2xl tracking-[-0.035em] text-foreground sm:text-[1.8rem]">Choose your setting</h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">Choose a warm light or dark workspace, or follow your device setting.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Color scheme preference">
          {themeOptions.map((option) => {
            const selected = theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "min-w-0 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand",
                  selected ? "border-brand bg-brand-soft/35" : "border-border bg-surface hover:border-brand/45 hover:bg-surface-raised"
                )}
              >
                <ThemePreview value={option.value} />
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><HugeiconsIcon icon={option.icon} className="size-4 text-brand" aria-hidden="true" />{option.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
                  </div>
                  <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-brand bg-brand text-brand-foreground" : "border-border bg-surface")} aria-hidden="true">
                    {selected && <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-8" aria-labelledby="session-heading">
        <div className="max-w-xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Account access</span>
          <h3 id="session-heading" className="mt-2 font-editorial text-2xl tracking-[-0.035em] text-foreground">Your current session</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">You are signed in on this device. Sign out when you are finished using this workspace.</p>
        </div>
        <Button variant="destructive" onClick={() => logout()} leadingIcon={<HugeiconsIcon icon={Logout01Icon} className="size-4" />} className="self-start sm:self-auto">
          Sign Out
        </Button>
      </section>
    </div>
  )
}
