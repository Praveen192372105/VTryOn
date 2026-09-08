import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const ROOT_DIR = path.resolve(__dirname, "../../")
const SRC_DIR = path.resolve(ROOT_DIR, "src")
const PKG_PATH = path.resolve(ROOT_DIR, "package.json")

function getAllSourceFiles(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)

  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllSourceFiles(filePath))
    } else if (/\.(ts|tsx)$/.test(file)) {
      results.push(filePath)
    }
  }

  return results
}

describe("Motion and Interaction System Architecture Tests", () => {
  const allFiles = getAllSourceFiles(SRC_DIR)

  it("prohibits framer-motion imports in favor of canonical motion/react", () => {
    const violations: string[] = []

    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8")
      if (content.includes('from "framer-motion"') || content.includes("from 'framer-motion'")) {
        violations.push(path.relative(SRC_DIR, file).replace(/\\/g, "/"))
      }
    }

    expect(violations).toEqual([])
  })

  it("scopes page transitions strictly to main content, leaving app shell (sidebar & header) static", () => {
    const appLayoutPath = path.resolve(SRC_DIR, "components/layout/app-layout.tsx")
    const appLayoutContent = fs.readFileSync(appLayoutPath, "utf-8")

    // Must import and use PageTransition
    expect(appLayoutContent).toContain("PageTransition")
    expect(appLayoutContent).toContain("<PageTransition>")

    // App sidebar and header must be outside PageTransition
    const sidebarIndex = appLayoutContent.indexOf("<AppSidebar")
    const headerIndex = appLayoutContent.indexOf("<header")
    const pageTransitionIndex = appLayoutContent.indexOf("<PageTransition>")
    const outletIndex = appLayoutContent.indexOf("<Outlet")

    expect(sidebarIndex).toBeGreaterThan(-1)
    expect(headerIndex).toBeGreaterThan(-1)
    expect(pageTransitionIndex).toBeGreaterThan(-1)
    expect(outletIndex).toBeGreaterThan(-1)

    // Sidebar and Header render before PageTransition
    expect(sidebarIndex).toBeLessThan(pageTransitionIndex)
    expect(headerIndex).toBeLessThan(pageTransitionIndex)

    // PageTransition wraps Outlet directly
    expect(pageTransitionIndex).toBeLessThan(outletIndex)
  })

  it("strictly prohibits celebratory particle/confetti libraries and effects", () => {
    const pkgContent = fs.readFileSync(PKG_PATH, "utf-8")
    const pkg = JSON.parse(pkgContent)
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    }

    const bannedPackages = [
      "canvas-confetti",
      "tsparticles",
      "react-confetti",
      "party-js",
      "js-confetti",
    ]

    for (const banned of bannedPackages) {
      expect(allDeps[banned], `Package ${banned} must not be installed`).toBeUndefined()
    }

    // Also check source code imports
    const violations: string[] = []
    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8")
      for (const banned of bannedPackages) {
        if (content.includes(banned)) {
          violations.push(`${path.relative(SRC_DIR, file).replace(/\\/g, "/")}: imports ${banned}`)
        }
      }
    }
    expect(violations).toEqual([])
  })

  it("implements shared layout highlight/border transitions for outfit and person selections", () => {
    const outfitSelectorPath = path.resolve(SRC_DIR, "features/try-on/components/outfit-selector.tsx")
    const outfitSelectorContent = fs.readFileSync(outfitSelectorPath, "utf-8")
    expect(outfitSelectorContent).toContain("motion")
    expect(outfitSelectorContent).toContain("layoutId")
    expect(outfitSelectorContent).toContain("useReducedMotion")

    const personSelectorPath = path.resolve(SRC_DIR, "features/try-on/components/person-selector.tsx")
    const personSelectorContent = fs.readFileSync(personSelectorPath, "utf-8")
    expect(personSelectorContent).toContain("motion")
    expect(personSelectorContent).toContain("layoutId")
    expect(personSelectorContent).toContain("useReducedMotion")

    const outfitCardPath = path.resolve(SRC_DIR, "features/outfits/components/outfit-card.tsx")
    const outfitCardContent = fs.readFileSync(outfitCardPath, "utf-8")
    expect(outfitCardContent).toContain("motion")
    expect(outfitCardContent).toContain("layoutId")
    expect(outfitCardContent).toContain("useReducedMotion")
  })

  it("settles upload preview into selected state with motion and reduced motion support", () => {
    const uploadPreviewPath = path.resolve(SRC_DIR, "features/uploads/components/person-upload-preview.tsx")
    const uploadPreviewContent = fs.readFileSync(uploadPreviewPath, "utf-8")

    expect(uploadPreviewContent).toContain("motion")
    expect(uploadPreviewContent).toContain("useReducedMotion")
    expect(uploadPreviewContent).toContain("shouldReduceMotion")
    // Confirm no particles or celebratory effects
    expect(uploadPreviewContent.toLowerCase()).not.toContain("confetti")
    expect(uploadPreviewContent.toLowerCase()).not.toContain("particle")
  })

  it("renders restrained shimmer progress in try-on processing and respects prefers-reduced-motion", () => {
    const processingPath = path.resolve(SRC_DIR, "features/try-on/components/try-on-processing.tsx")
    const processingContent = fs.readFileSync(processingPath, "utf-8")

    expect(processingContent).toContain("useReducedMotion")
    expect(processingContent).toContain("progressbar")
    expect(processingContent).toContain("shouldReduceMotion")
    expect(processingContent).toContain("motion.div")
  })

  it("crossfades from processing skeleton to result after image decode in ResultViewer", () => {
    const resultViewerPath = path.resolve(SRC_DIR, "features/try-on/components/result-viewer.tsx")
    const resultViewerContent = fs.readFileSync(resultViewerPath, "utf-8")

    expect(resultViewerContent).toContain("useReducedMotion")
    expect(resultViewerContent).toContain("isImageDecoded")
    expect(resultViewerContent).toContain("decode")
    expect(resultViewerContent).toContain("motion.div")
    expect(resultViewerContent).toContain("Loading private result…")
  })

  it("provides short scale/opacity feedback on favorite toggle without delaying mutation", () => {
    const favButtonPath = path.resolve(SRC_DIR, "features/favorites/components/favorite-button.tsx")
    const favButtonContent = fs.readFileSync(favButtonPath, "utf-8")

    expect(favButtonContent).toContain("useReducedMotion")
    expect(favButtonContent).toContain("motion.span")
    expect(favButtonContent).toContain("mutate({")

    // Assert that mutate is called directly in handleClick without setTimeout or delay
    expect(favButtonContent).not.toMatch(/setTimeout\s*\([^)]*mutate/)
  })

  it("ensures PageTransition bypasses animation and renders immediately without blocking when reduced motion is requested", () => {
    const pageTransitionPath = path.resolve(SRC_DIR, "components/layout/page-transition.tsx")
    const pageTransitionContent = fs.readFileSync(pageTransitionPath, "utf-8")

    expect(pageTransitionContent).toContain("useReducedMotion")
    expect(pageTransitionContent).toContain("prefersReduced")
    // When prefersReduced is true, it renders children directly without motion.div delay
    expect(pageTransitionContent).toContain("if (prefersReduced)")
    expect(pageTransitionContent).toContain("<div className={className}>{children}</div>")
  })
})
