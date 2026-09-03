export function scrollToSection(sectionId: string, updateUrl = true): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false
  }

  const cleanId = sectionId.startsWith("#") ? sectionId.slice(1) : sectionId
  const element = document.getElementById(cleanId)

  if (!element) {
    return false
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  element.scrollIntoView({
    behavior: prefersReduced ? "auto" : "smooth",
    block: "start",
  })

  if (updateUrl && window.history && window.history.pushState) {
    window.history.pushState(null, "", `#${cleanId}`)
  }

  return true
}
