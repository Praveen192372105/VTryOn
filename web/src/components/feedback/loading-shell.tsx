import { cn } from "../../lib/utils"

export function LoadingShell({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "min-h-screen w-full flex flex-col items-center justify-center bg-black text-zinc-400 p-6",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Monogram Brand Loading Indicator */}
        <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="font-mono text-sm font-semibold tracking-widest text-zinc-200">V</span>
          <span className="absolute inset-0 rounded-xl border border-zinc-500/40 animate-ping opacity-75" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-mono tracking-widest uppercase text-zinc-500">
            V Try-On
          </span>
          <span className="text-sm text-zinc-400 animate-pulse">Initializing studio...</span>
        </div>
      </div>
    </div>
  )
}

export function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-full space-y-4 animate-pulse p-6", className)}>
      <div className="h-8 w-48 bg-zinc-900 rounded-md" />
      <div className="h-4 w-72 bg-zinc-900/60 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-lg bg-zinc-900/80 border border-zinc-800/40" />
        ))}
      </div>
    </div>
  )
}
