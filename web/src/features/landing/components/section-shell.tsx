import React from "react"
import { cn } from "../../../lib/utils"

interface SectionShellProps {
  id?: string
  sectionNumber?: string
  eyebrow?: string
  title?: string | React.ReactNode
  subtitle?: string | React.ReactNode
  children: React.ReactNode
  className?: string
  containerClassName?: string
  align?: "left" | "center"
}

export function SectionShell({
  id,
  sectionNumber,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  containerClassName,
  align = "left",
}: SectionShellProps) {
  return (
    <section
      id={id}
      data-section={sectionNumber}
      className={cn(
        "relative py-20 sm:py-28 md:py-32 border-b border-zinc-900/80 scroll-mt-20 overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10",
          containerClassName
        )}
      >
        {(eyebrow || title || subtitle) && (
          <div
            className={cn(
              "space-y-4 mb-12 sm:mb-16",
              align === "center" ? "text-center max-w-3xl mx-auto" : "max-w-3xl"
            )}
          >
            {eyebrow && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800/80 bg-zinc-950/80 text-xs font-mono text-zinc-400 tracking-wider uppercase">
                {sectionNumber && (
                  <span aria-hidden="true" className="text-zinc-600 font-semibold">
                    {sectionNumber} —
                  </span>
                )}
                <span>{eyebrow}</span>
              </div>
            )}

            {title && (
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-zinc-100 leading-[1.15]">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </section>
  )
}
