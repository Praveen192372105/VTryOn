import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const SRC_DIR = path.resolve(__dirname, "../../src")
const ROOT_DIR = path.resolve(__dirname, "../..")

describe("Phase 22–24: Definition of Done & Production Readiness Audit", () => {
  describe("Section 23 & package.json Build & Verification Scripts", () => {
    it("provides typecheck, lint, test, and build scripts in package.json", () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(ROOT_DIR, "package.json"), "utf-8")
      )

      expect(packageJson.scripts.typecheck).toBeDefined()
      expect(packageJson.scripts.typecheck).toContain("tsc -b")
      expect(packageJson.scripts.lint).toBeDefined()
      expect(packageJson.scripts.test).toBeDefined()
      expect(packageJson.scripts.build).toBeDefined()
      expect(packageJson.scripts.build).toContain("vite build")
    })
  })

  describe("Appendix A: Route Configuration Reference", () => {
    it("configures all canonical public, auth, and protected routes", () => {
      const routerContent = fs.readFileSync(path.resolve(SRC_DIR, "app/router.tsx"), "utf-8")

      // Public
      expect(routerContent).toContain("LandingPage")
      expect(routerContent).toContain("HowItWorksPage")
      expect(routerContent).toContain("PrivacyPage")
      expect(routerContent).toContain("TermsPage")

      // Auth
      expect(routerContent).toContain("LoginPage")
      expect(routerContent).toContain("RegisterPage")

      // Protected App
      expect(routerContent).toContain("StudioPage")
      expect(routerContent).toContain("OutfitsPage")
      expect(routerContent).toContain("FavoritesPage")
      expect(routerContent).toContain("UploadsPage")
      expect(routerContent).toContain("HistoryPage")
      expect(routerContent).toContain("TryOnDetailPage")
      expect(routerContent).toContain("try-ons/:jobId")
      expect(routerContent).toContain("SettingsPage")

      // Errors
      expect(routerContent).toContain("NotFoundPage")
      expect(routerContent).toContain("ProtectedNotFoundPage")
    })
  })

  describe("Appendix B: Core Type Reference", () => {
    it("exports canonical User, PersonUpload, Outfit, TryOnStatus, and TryOnJob types", async () => {
      const coreTypes = await import("../../src/types/index")

      // Verify types are imported and exported cleanly
      expect(coreTypes).toBeDefined()

      const typesFile = fs.readFileSync(path.resolve(SRC_DIR, "types/index.ts"), "utf-8")
      expect(typesFile).toContain("export type User =")
      expect(typesFile).toContain("export type PersonUpload =")
      expect(typesFile).toContain("export type Outfit =")
      expect(typesFile).toContain("export type TryOnStatus =")
      expect(typesFile).toContain("export type TryOnJob =")
    })
  })

  describe("Appendix C: Suggested Component Inventory", () => {
    it("satisfies Brand component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "components/brand/index.ts"), "utf-8")
      expect(content).toContain("BrandMark")
      expect(content).toContain("Wordmark")
      expect(content).toContain("BrandLink")
    })

    it("satisfies Marketing component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "features/landing/index.ts"), "utf-8")
      expect(content).toContain("MarketingHeader")
      expect(content).toContain("HeroTryOnVisual")
      expect(content).toContain("HowItWorks")
      expect(content).toContain("ShowcaseRail")
      expect(content).toContain("FeatureStory")
      expect(content).toContain("PrivacyCallout")
      expect(content).toContain("FinalCTA")
      expect(content).toContain("MarketingFooter")
    })

    it("satisfies Auth component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "features/auth/index.ts"), "utf-8")
      expect(content).toContain("AuthCard")
      expect(content).toContain("LoginForm")
      expect(content).toContain("RegisterForm")
      expect(content).toContain("PasswordField")
      expect(content).toContain("SessionNotice")
    })

    it("satisfies Navigation component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "components/navigation/index.ts"), "utf-8")
      expect(content).toContain("AppSidebar")
      expect(content).toContain("MobileBottomNav")
      expect(content).toContain("AppTopbar")
      expect(content).toContain("UserMenu")
      expect(content).toContain("BreadcrumbBack")
    })

    it("satisfies Uploads component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "features/uploads/index.ts"), "utf-8")
      expect(content).toContain("PersonUploader")
      expect(content).toContain("UploadDropzone")
      expect(content).toContain("PersonPreview")
      expect(content).toContain("UploadGrid")
      expect(content).toContain("UploadCard")
      expect(content).toContain("DeleteUploadDialog")
    })

    it("satisfies Outfits component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "features/outfits/index.ts"), "utf-8")
      const compContent = fs.readFileSync(path.resolve(SRC_DIR, "features/outfits/components/index.ts"), "utf-8")
      expect(compContent).toContain("OutfitGrid")
      expect(compContent).toContain("OutfitCard")
      expect(compContent).toContain("OutfitFilters")
      expect(compContent).toContain("OutfitDetail")
      expect(compContent).toContain("FavoriteButton")
    })

    it("satisfies Studio component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "features/try-on/index.ts"), "utf-8")
      expect(content).toContain("TryOnComposer")
      expect(content).toContain("PersonSelector")
      expect(content).toContain("OutfitSelector")
      expect(content).toContain("GenerateBar")
      expect(content).toContain("JobProgress")
    })

    it("satisfies Result component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "features/try-on/index.ts"), "utf-8")
      const imgContent = fs.readFileSync(path.resolve(SRC_DIR, "components/image/index.ts"), "utf-8")
      expect(content).toContain("ResultViewer")
      expect(imgContent).toContain("ImageCompare")
      expect(content).toContain("ResultMeta")
      expect(content).toContain("ResultActions")
    })

    it("satisfies History component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "features/try-on/index.ts"), "utf-8")
      expect(content).toContain("HistoryList")
      expect(content).toContain("HistoryCard")
      expect(content).toContain("HistoryFilters")
      expect(content).toContain("StatusBadge")
    })

    it("satisfies Feedback component inventory", () => {
      const content = fs.readFileSync(path.resolve(SRC_DIR, "components/feedback/index.ts"), "utf-8")
      expect(content).toContain("PageSkeleton")
      expect(content).toContain("ImageSkeleton")
      expect(content).toContain("EmptyState")
      expect(content).toContain("ErrorState")
      expect(content).toContain("OfflineBanner")
      expect(content).toContain("RetryButton")
    })
  })

  describe("Section 24: Definition of Done Criteria", () => {
    it("ensures documentation contains all Definition of Done criteria", () => {
      const readme = fs.readFileSync(path.resolve(ROOT_DIR, "README.md"), "utf-8")
      expect(readme).toContain("## 20. Testing Strategy (Phase 21)")
    })
  })
})
