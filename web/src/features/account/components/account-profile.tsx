import { useState } from "react"
import { useAuth } from "@/features/auth"
import { Button } from "../../../components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  Logout01Icon,
  SecurityCheckIcon,
  Moon02Icon,
  Sun01Icon,
  ComputerIcon,
  CheckmarkCircle01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { useTheme, type Theme } from "../../../lib/theme/theme-provider"
import { cn } from "../../../lib/utils"

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard fails
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied to clipboard!" : label}
      aria-label={copied ? "Copied to clipboard!" : label}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono transition-all duration-150 cursor-pointer select-none",
        copied
          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
          : "text-muted-foreground hover:text-foreground bg-surface-subtle hover:bg-surface-raised border border-border/80"
      )}
    >
      {copied ? (
        <>
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

export function AccountProfile() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const getInitials = (name?: string) => {
    if (!name) return "U"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const themeOptions: {
    value: Theme
    title: string
    description: string
    icon: typeof Moon02Icon
  }[] = [
    {
      value: "dark",
      title: "Dark",
      description: "High contrast, gentle on eyes",
      icon: Moon02Icon,
    },
    {
      value: "light",
      title: "Light",
      description: "Clean, high-clarity daylight theme",
      icon: Sun01Icon,
    },
    {
      value: "system",
      title: "System",
      description: "Synchronizes with device OS",
      icon: ComputerIcon,
    },
  ]

  return (
    <div className="w-full space-y-6">
      {/* 1. Account Profile Identity Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-md shadow-xs transition-all">
        {/* Subtle Ambient Header Banner */}
        <div className="relative h-24 sm:h-28 w-full bg-gradient-to-r from-primary/10 via-accent/15 to-primary/5 border-b border-border/40 overflow-hidden">
          <div className="absolute -top-12 -right-12 size-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
          <div className="absolute top-4 right-4 sm:top-5 sm:right-6 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-surface/90 backdrop-blur-md border border-border/70 text-foreground shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Account</span>
          </div>
        </div>

        {/* Profile Content with overlapping avatar */}
        <div className="px-6 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-12 mb-5">
            <div className="flex items-end gap-4">
              <div className="relative size-20 sm:size-22 rounded-2xl ring-4 ring-surface bg-surface-raised border border-border/80 flex items-center justify-center font-heading font-semibold text-xl sm:text-2xl text-foreground shadow-sm shrink-0 select-none">
                {user?.name ? (
                  <span>{getInitials(user.name)}</span>
                ) : (
                  <HugeiconsIcon icon={UserIcon} className="size-8 text-muted-foreground" />
                )}
                <span
                  className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 ring-2 ring-surface flex items-center justify-center shadow-xs"
                  title="Online & Active"
                />
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight truncate">
                    {user?.name || "User"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">
                    {user?.email || "No email available"}
                  </p>
                  {user?.email && <CopyButton text={user.email} label="Copy email" />}
                </div>
              </div>
            </div>
          </div>

          {/* Account Metrics & Security Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-border/70">
            {/* Metric 1: Member Status */}
            <div className="p-3.5 rounded-xl bg-surface-subtle/70 border border-border/60 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Account Status</span>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Active & Verified</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Standard Studio Access</p>
              </div>
            </div>

            {/* Metric 2: Privacy Protection */}
            <div className="p-3.5 rounded-xl bg-surface-subtle/70 border border-border/60 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Data Isolation</span>
                <HugeiconsIcon icon={SecurityCheckIcon} className="size-3.5 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-medium text-xs text-emerald-500 dark:text-emerald-400">
                  <span>Isolated & Private</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Photos strictly user-scoped</p>
              </div>
            </div>

            {/* Metric 3: Account Identifier */}
            <div className="p-3.5 rounded-xl bg-surface-subtle/70 border border-border/60 flex flex-col justify-between space-y-2 sm:col-span-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>User Identifier</span>
                <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-xs text-foreground truncate max-w-[120px]" title={user?.id || "Session User"}>
                    {user?.id ? `${user.id.slice(0, 10)}...` : "Active User"}
                  </span>
                  {user?.id && <CopyButton text={user.id} label="Copy user ID" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Authenticated Session</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Appearance & Theme Preferences Card */}
      <div className="rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-md p-6 space-y-5 shadow-xs transition-all">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">Appearance Theme</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select your interface color scheme preference or synchronize automatically with your operating system.
          </p>
        </div>

        {/* Visual Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5" role="radiogroup" aria-label="Color scheme preference">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer group",
                  isSelected
                    ? "border-primary bg-surface-raised shadow-xs ring-2 ring-primary/20"
                    : "border-border/70 bg-surface-subtle/40 hover:bg-surface-subtle hover:border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Visual Preview Graphic */}
                <div className="w-full mb-3">
                  {opt.value === "dark" && (
                    <div className="w-full h-16 rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 flex flex-col justify-between overflow-hidden shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="size-2 rounded-full bg-zinc-700" />
                          <div className="h-1.5 w-10 rounded bg-zinc-800" />
                        </div>
                        <HugeiconsIcon icon={Moon02Icon} className="size-3 text-zinc-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 w-16 rounded bg-zinc-700" />
                        <div className="h-1 w-12 rounded bg-zinc-800" />
                      </div>
                    </div>
                  )}

                  {opt.value === "light" && (
                    <div className="w-full h-16 rounded-lg bg-white border border-zinc-200 p-2.5 flex flex-col justify-between overflow-hidden shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="size-2 rounded-full bg-zinc-300" />
                          <div className="h-1.5 w-10 rounded bg-zinc-200" />
                        </div>
                        <HugeiconsIcon icon={Sun01Icon} className="size-3 text-amber-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 w-16 rounded bg-zinc-300" />
                        <div className="h-1 w-12 rounded bg-zinc-200" />
                      </div>
                    </div>
                  )}

                  {opt.value === "system" && (
                    <div className="w-full h-16 rounded-lg border border-border/80 flex overflow-hidden shadow-inner">
                      <div className="w-1/2 h-full bg-white p-2 flex flex-col justify-between border-r border-zinc-200">
                        <div className="size-2 rounded-full bg-zinc-300" />
                        <HugeiconsIcon icon={Sun01Icon} className="size-3 text-amber-500" />
                      </div>
                      <div className="w-1/2 h-full bg-zinc-950 p-2 flex flex-col justify-between items-end">
                        <div className="size-2 rounded-full bg-zinc-700" />
                        <HugeiconsIcon icon={Moon02Icon} className="size-3 text-zinc-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Option Details */}
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={opt.icon}
                        className={cn(
                          "size-3.5 shrink-0",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span className="text-xs font-semibold text-foreground">{opt.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{opt.description}</p>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    className={cn(
                      "size-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface"
                    )}
                  >
                    {isSelected && (
                      <div className="size-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Session Security & Sign Out Card */}
      <div className="rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-md p-6 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground tracking-tight">Active Session & Security</h3>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              You are securely signed in on this device. Signing out terminates your session tokens and purges cached try-on queries from local storage.
            </p>
          </div>

          <Button
            variant="destructive"
            size="default"
            onClick={() => logout()}
            leadingIcon={<HugeiconsIcon icon={Logout01Icon} className="size-4" />}
            className="cursor-pointer shrink-0 font-medium"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
