import { useEffect } from "react"

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const baseTitle = "V Try-On"
    document.title = title ? `${baseTitle} — ${title}` : `${baseTitle} — AI Virtual Fitting Room`
  }, [title])
}
