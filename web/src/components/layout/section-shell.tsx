import React from "react"
import { cn } from "../../lib/utils"

export interface SectionShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  size?: "app" | "marketing" | "narrow"
  containerClassName?: string
}

export function SectionShell({
  children,
  size = "app",
  className,
  containerClassName,
  ...props
}: SectionShellProps) {
  const sizeClasses = {
    app: "max-w-7xl",
    marketing: "max-w-7xl py-12 sm:py-20 lg:py-24",
    narrow: "max-w-4xl",
  }[size]

  return (
    <section
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        sizeClasses,
        containerClassName,
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
}
