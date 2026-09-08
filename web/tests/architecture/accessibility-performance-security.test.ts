import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const ROOT_DIR = path.resolve(__dirname, "../../")
const SRC_DIR = path.resolve(ROOT_DIR, "src")

describe("Accessibility, Performance and Security Architecture Tests (Phase 20)", () => {
  describe("20.1 Accessibility", () => {
    it("enforces visible keyboard focus styles in globals.css", () => {
      const globalsCssPath = path.resolve(SRC_DIR, "styles/globals.css")
      const globalsCss = fs.readFileSync(globalsCssPath, "utf-8")

      expect(globalsCss).toContain(":focus-visible")
      expect(globalsCss).toContain("outline: 2px solid")
      expect(globalsCss).toContain("outline-offset: 2px")
    })

    it("implements route-level focus management after navigation in AppLayout", () => {
      const appLayoutPath = path.resolve(SRC_DIR, "components/layout/app-layout.tsx")
      const appLayout = fs.readFileSync(appLayoutPath, "utf-8")

      expect(appLayout).toContain("location.pathname")
      expect(appLayout).toContain('document.getElementById("main-content")')
      expect(appLayout).toContain("mainEl.focus({ preventScroll: true })")
      expect(appLayout).toContain('id="main-content"')
      expect(appLayout).toContain("tabIndex={-1}")
    })

    it("provides meaningful and contextual alt text for imagery", () => {
      const uploadPreviewPath = path.resolve(
        SRC_DIR,
        "features/uploads/components/person-upload-preview.tsx"
      )
      const uploadPreview = fs.readFileSync(uploadPreviewPath, "utf-8")
      expect(uploadPreview).toContain('alt="Your selected person photo"')

      const personSelectorPath = path.resolve(
        SRC_DIR,
        "features/try-on/components/person-selector.tsx"
      )
      const personSelector = fs.readFileSync(personSelectorPath, "utf-8")
      expect(personSelector).toContain("Your selected person photo")

      const resultViewerPath = path.resolve(
        SRC_DIR,
        "features/try-on/components/result-viewer.tsx"
      )
      const resultViewer = fs.readFileSync(resultViewerPath, "utf-8")
      expect(resultViewer).toContain("Virtual try-on look")
    })

    it("uses accessible dialog and sheet primitives with escape handling", () => {
      const dialogPath = path.resolve(SRC_DIR, "components/ui/dialog.tsx")
      const dialog = fs.readFileSync(dialogPath, "utf-8")
      expect(dialog).toContain("@base-ui/react/dialog")

      const sheetPath = path.resolve(SRC_DIR, "components/ui/sheet.tsx")
      const sheet = fs.readFileSync(sheetPath, "utf-8")
      expect(sheet).toContain("@base-ui/react/dialog")
    })

    it("restrains aria-live announcements during asynchronous processing without polling spam", () => {
      const processingPath = path.resolve(
        SRC_DIR,
        "features/try-on/components/try-on-processing.tsx"
      )
      const processing = fs.readFileSync(processingPath, "utf-8")

      expect(processing).toContain('aria-live="polite"')
      expect(processing).toContain('role="status"')
      expect(processing).toContain("prevStatusRef")
    })

    it("never uses color as the sole indicator of status", () => {
      const failurePath = path.resolve(
        SRC_DIR,
        "features/try-on/components/try-on-failure.tsx"
      )
      const failure = fs.readFileSync(failurePath, "utf-8")

      // Failed state has explicit icons and textual titles, not just red color
      expect(failure).toContain("AlertCircleIcon")
      expect(failure).toContain('role="alert"')

      const favoriteButtonPath = path.resolve(
        SRC_DIR,
        "features/favorites/components/favorite-button.tsx"
      )
      const favoriteButton = fs.readFileSync(favoriteButtonPath, "utf-8")
      expect(favoriteButton).toContain("aria-pressed")
      expect(favoriteButton).toContain("aria-label")
    })
  })

  describe("20.2 Performance", () => {
    it("lazy-loads authenticated route bundles", () => {
      const routerPath = path.resolve(SRC_DIR, "app/router.tsx")
      const router = fs.readFileSync(routerPath, "utf-8")

      expect(router).toContain("React.lazy(() => import(")
      expect(router).toContain("../pages/app/studio-page")
      expect(router).toContain("../pages/app/outfits-page")
      expect(router).toContain("../pages/app/history-page")
      expect(router).toContain("<SuspenseWrapper>")
    })

    it("lazy-loads heavy image comparison utilities", () => {
      const resultViewerPath = path.resolve(
        SRC_DIR,
        "features/try-on/components/result-viewer.tsx"
      )
      const resultViewer = fs.readFileSync(resultViewerPath, "utf-8")

      expect(resultViewer).toContain("lazy(() =>")
      expect(resultViewer).toContain("image/image-compare")
      expect(resultViewer).toContain("<Suspense")
    })

    it("configures intentional TanStack Query stale times and avoids redundant window focus refetching", () => {
      const outfitsHookPath = path.resolve(
        SRC_DIR,
        "features/outfits/hooks/use-outfits.ts"
      )
      const outfitsHook = fs.readFileSync(outfitsHookPath, "utf-8")

      // Outfits list has 5m staleTime and refetchOnWindowFocus: false
      expect(outfitsHook).toContain("staleTime: 5 * 60 * 1000")
      expect(outfitsHook).toContain("refetchOnWindowFocus: false")

      // Single outfit detail has 10m staleTime and refetchOnWindowFocus: false
      expect(outfitsHook).toContain("staleTime: 10 * 60 * 1000")
    })

    it("preloads and decodes the final result before replacing its skeleton", () => {
      const resultViewerPath = path.resolve(
        SRC_DIR,
        "features/try-on/components/result-viewer.tsx"
      )
      const resultViewer = fs.readFileSync(resultViewerPath, "utf-8")

      expect(resultViewer).toContain(".decode()")
      expect(resultViewer).toContain("new Image()")
    })

    it("configures Vite build for content-hashed asset output names", () => {
      const viteConfigPath = path.resolve(ROOT_DIR, "vite.config.ts")
      const viteConfig = fs.readFileSync(viteConfigPath, "utf-8")

      expect(viteConfig).toContain("assets/[name]-[hash].js")
      expect(viteConfig).toContain("assets/[name]-[hash].[ext]")
    })

    it("configures CDN immutable cache headers for hashed assets in public/_headers", () => {
      const headersPath = path.resolve(ROOT_DIR, "public/_headers")
      expect(fs.existsSync(headersPath)).toBe(true)

      const headers = fs.readFileSync(headersPath, "utf-8")
      expect(headers).toContain("/assets/*")
      expect(headers).toContain("Cache-Control: public, max-age=31536000, immutable")
      expect(headers).toContain("/*.html")
      expect(headers).toContain("must-revalidate")
    })
  })

  describe("20.3 Frontend Security", () => {
    it("documents client route guards as UX redirection with authoritative backend checks", () => {
      const guardsPath = path.resolve(SRC_DIR, "app/guards.tsx")
      const guards = fs.readFileSync(guardsPath, "utf-8")

      expect(guards).toContain("UX Redirection")
      expect(guards).toContain("Backend endpoint")
      expect(guards).toContain("strictly authoritative")
    })

    it("avoids rendering raw server HTML anywhere in features and pages", () => {
      const scanDir = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        const violations: string[] = []
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            violations.push(...scanDir(fullPath))
          } else if (/\.(tsx|ts)$/.test(entry.name)) {
            const content = fs.readFileSync(fullPath, "utf-8")
            if (content.includes("dangerouslySetInnerHTML")) {
              violations.push(fullPath)
            }
          }
        }
        return violations
      }

      const featureViolations = scanDir(path.resolve(SRC_DIR, "features"))
      const pageViolations = scanDir(path.resolve(SRC_DIR, "pages"))

      expect(featureViolations).toEqual([])
      expect(pageViolations).toEqual([])
    })

    it("restricts accepted upload MIME types in the file picker", () => {
      const dropzonePath = path.resolve(
        SRC_DIR,
        "features/uploads/components/person-upload-dropzone.tsx"
      )
      const dropzone = fs.readFileSync(dropzonePath, "utf-8")
      expect(dropzone).toContain("accept={ACCEPTED_IMAGE_TYPES_STRING}")

      const constantsPath = path.resolve(SRC_DIR, "features/uploads/constants.ts")
      const constants = fs.readFileSync(constantsPath, "utf-8")
      expect(constants).toContain('"image/jpeg"')
      expect(constants).toContain('"image/png"')
      expect(constants).toContain('"image/webp"')
    })

    it("enforces strict Content Security Policy in index.html", () => {
      const indexPath = path.resolve(ROOT_DIR, "index.html")
      const indexHtml = fs.readFileSync(indexPath, "utf-8")

      expect(indexHtml).toContain('http-equiv="Content-Security-Policy"')
      expect(indexHtml).toContain("default-src 'self'")
      expect(indexHtml).toContain("frame-ancestors 'none'")
      expect(indexHtml).toContain("object-src 'none'")
    })

    it("strictly prohibits console logging of tokens, passwords, or sensitive payloads", () => {
      const scanForConsole = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        const violations: string[] = []
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            if (entry.name === "__tests__" || entry.name === "test") continue
            violations.push(...scanForConsole(fullPath))
          } else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.includes(".test.")) {
            const content = fs.readFileSync(fullPath, "utf-8")
            if (/console\.(log|info|warn|error|debug)\(/.test(content)) {
              violations.push(fullPath)
            }
          }
        }
        return violations
      }

      const consoleUsages = scanForConsole(SRC_DIR)
      expect(consoleUsages).toEqual([])
    })
  })
})
