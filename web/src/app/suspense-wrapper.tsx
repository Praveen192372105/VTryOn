import React, { Suspense } from "react"
import { LoadingShell } from "../components/feedback/loading-shell"

export function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingShell />}>{children}</Suspense>
}
