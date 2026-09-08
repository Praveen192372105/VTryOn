import { describe, it, expect } from "vitest"
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION, landingNavigation } from "../navigation"
import { ROUTES } from "@/app/route-paths"

describe("Navigation Configuration", () => {
  it("primary navigation uses canonical app routes", () => {
    const primaryHrefs = PRIMARY_NAVIGATION.map((item) => item.href)
    expect(primaryHrefs).toContain(ROUTES.app.studio)
    expect(primaryHrefs).toContain(ROUTES.app.outfits)
    expect(primaryHrefs).toContain(ROUTES.app.favorites)
    expect(primaryHrefs).toContain(ROUTES.app.history)
  })

  it("secondary navigation uses canonical app routes", () => {
    const secondaryHrefs = SECONDARY_NAVIGATION.map((item) => item.href)
    expect(secondaryHrefs).toContain(ROUTES.app.uploads)
    expect(secondaryHrefs).toContain(ROUTES.app.settings)
  })

  it("landing navigation targets section anchors", () => {
    landingNavigation.forEach((item) => {
      expect(item.href).toMatch(/^#[a-z0-9-]+$/)
    })
  })
})
