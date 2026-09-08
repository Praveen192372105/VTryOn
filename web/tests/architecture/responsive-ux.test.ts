import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const ROOT_DIR = path.resolve(__dirname, "../../")
const SRC_DIR = path.resolve(ROOT_DIR, "src")

describe("Responsive Phone, Tablet and Desktop UX Architecture Tests", () => {
  describe("1. Navigation Responsiveness", () => {
    it("configures phone bottom navigation and compact top bar", () => {
      const appLayoutPath = path.resolve(SRC_DIR, "components/layout/app-layout.tsx")
      const appLayoutContent = fs.readFileSync(appLayoutPath, "utf-8")

      // MobileTabBar must be rendered and scoped to mobile
      expect(appLayoutContent).toContain("<MobileTabBar")
      // Compact top bar header h-14
      expect(appLayoutContent).toContain("h-14")
      expect(appLayoutContent).toContain("<header")

      // Mobile tab bar file checks
      const tabbarPath = path.resolve(SRC_DIR, "components/navigation/mobile-tabbar.tsx")
      const tabbarContent = fs.readFileSync(tabbarPath, "utf-8")
      expect(tabbarContent).toContain("md:hidden")
      expect(tabbarContent).toContain("fixed bottom-0")
    })

    it("configures adaptive/persistent compact rail on tablet and desktop", () => {
      const appLayoutPath = path.resolve(SRC_DIR, "components/layout/app-layout.tsx")
      const appLayoutContent = fs.readFileSync(appLayoutPath, "utf-8")

      // Initializes with compact rail defaultOpen={false}
      expect(appLayoutContent).toContain("<SidebarProvider defaultOpen={false}>")

      const sidebarPath = path.resolve(SRC_DIR, "components/app-sidebar.tsx")
      const sidebarContent = fs.readFileSync(sidebarPath, "utf-8")
      // Collapsible icon rail
      expect(sidebarContent).toContain('collapsible="icon"')
      expect(sidebarContent).toContain("group-data-[collapsible=icon]")
    })
  })

  describe("2. Landing Hero Responsiveness", () => {
    it("implements phone stack, tablet asymmetry, and desktop two-column composition", () => {
      const heroPath = path.resolve(SRC_DIR, "features/landing/components/hero-section.tsx")
      const heroContent = fs.readFileSync(heroPath, "utf-8")

      // Phone single-column stack
      expect(heroContent).toContain("grid-cols-1")

      // Tablet asymmetry
      expect(heroContent).toContain("md:grid-cols-12")
      expect(heroContent).toContain("md:col-span-7")
      expect(heroContent).toContain("md:col-span-5")
      expect(heroContent).toContain("md:text-left")

      // Desktop cinematic composition
      expect(heroContent).toContain("lg:grid-cols-12")
      expect(heroContent).toContain("lg:col-span-6")
    })
  })

  describe("3. Outfits Responsiveness", () => {
    it("enforces 2 cols on phone, 3-4 cols on tablet, and 4-6 cols on desktop", () => {
      const outfitGridPath = path.resolve(SRC_DIR, "features/outfits/components/outfit-grid.tsx")
      const outfitGridContent = fs.readFileSync(outfitGridPath, "utf-8")

      // Phone: 2 columns
      expect(outfitGridContent).toContain("grid-cols-2")
      // Tablet: 3-4 columns
      expect(outfitGridContent).toContain("sm:grid-cols-3")
      expect(outfitGridContent).toContain("md:grid-cols-4")
      // Desktop: 4-6 columns
      expect(outfitGridContent).toContain("lg:grid-cols-5")
      expect(outfitGridContent).toContain("xl:grid-cols-6")
    })
  })

  describe("4. Studio Responsiveness", () => {
    it("implements sequential cards on phone, adaptive split on tablet, and workspace split on desktop", () => {
      const composerPath = path.resolve(SRC_DIR, "features/try-on/components/try-on-composer.tsx")
      const composerContent = fs.readFileSync(composerPath, "utf-8")

      // Phone sequential cards (grid-cols-1)
      expect(composerContent).toContain("grid-cols-1")
      // Tablet adaptive split (md:grid-cols-2)
      expect(composerContent).toContain("md:grid-cols-2")
      expect(composerContent).toContain("md:col-span-1")
      // Desktop workspace split (lg:grid-cols-12, 7 cols for Person, 5 cols for Outfit)
      expect(composerContent).toContain("lg:grid-cols-12")
      expect(composerContent).toContain("lg:col-span-7")
      expect(composerContent).toContain("lg:col-span-5")
    })
  })

  describe("5. Result Responsiveness", () => {
    it("implements full-width on phone, wide on tablet, and large canvas + side metadata on desktop", () => {
      const resultViewerPath = path.resolve(SRC_DIR, "features/try-on/components/result-viewer.tsx")
      const resultViewerContent = fs.readFileSync(resultViewerPath, "utf-8")

      // Responsive grid container
      expect(resultViewerContent).toContain("grid grid-cols-1 lg:grid-cols-12")
      // Desktop large comparison canvas
      expect(resultViewerContent).toContain("lg:col-span-7 xl:col-span-8")
      // Desktop side metadata & action controls
      expect(resultViewerContent).toContain("lg:col-span-5 xl:col-span-4")
      expect(resultViewerContent).toContain("lg:sticky")
    })
  })

  describe("6. History Responsiveness", () => {
    it("implements image cards on phone, dense cards on tablet, and hybrid with rich metadata on desktop", () => {
      const historyGridPath = path.resolve(SRC_DIR, "features/try-on/components/try-on-history-grid.tsx")
      const historyGridContent = fs.readFileSync(historyGridPath, "utf-8")

      // Phone: image cards/list (grid-cols-1)
      expect(historyGridContent).toContain("grid-cols-1")
      // Tablet: dense cards (sm:grid-cols-2 md:grid-cols-3)
      expect(historyGridContent).toContain("sm:grid-cols-2")
      expect(historyGridContent).toContain("md:grid-cols-3")
      // Desktop: grid/list hybrid (lg:grid-cols-3 xl:grid-cols-4)
      expect(historyGridContent).toContain("lg:grid-cols-3")
      expect(historyGridContent).toContain("xl:grid-cols-4")

      // Rich metadata and paired garment badge on history card
      const historyCardPath = path.resolve(SRC_DIR, "features/try-on/components/try-on-history-card.tsx")
      const historyCardContent = fs.readFileSync(historyCardPath, "utf-8")
      // Paired garment thumbnail badge
      expect(historyCardContent).toContain("Paired with")
      // Desktop resolution metadata badge
      expect(historyCardContent).toContain("job.result?.width")
      expect(historyCardContent).toContain("hidden lg:inline-block")
    })
  })
})
