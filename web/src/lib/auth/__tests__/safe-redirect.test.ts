import { describe, it, expect } from "vitest"
import { getSafeRedirectTarget } from "../safe-redirect"
import { ROUTES } from "@/app/route-paths"

describe("getSafeRedirectTarget", () => {
  it("allows valid protected app paths", () => {
    expect(getSafeRedirectTarget("/app/studio")).toBe("/app/studio")
    expect(getSafeRedirectTarget("/app/history")).toBe("/app/history")
    expect(getSafeRedirectTarget("/app/try-ons/job_12345")).toBe("/app/try-ons/job_12345")
  })

  it("preserves valid query parameters and hashes on internal paths", () => {
    expect(getSafeRedirectTarget("/app/outfits?category=dresses")).toBe("/app/outfits?category=dresses")
    expect(getSafeRedirectTarget("/app/history?page=2#top")).toBe("/app/history?page=2#top")
  })

  it("rejects external absolute URLs and falls back to studio", () => {
    expect(getSafeRedirectTarget("https://evil.example")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("http://evil.example")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("https://evil.example/app/studio")).toBe(ROUTES.app.studio)
  })

  it("rejects protocol-relative and malformed slashes", () => {
    expect(getSafeRedirectTarget("//evil.example")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("///evil.example")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("/\\evil.example")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("\\evil.example")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("/%2F%2Fevil.example")).toBe(ROUTES.app.studio)
  })

  it("rejects javascript and data schemes", () => {
    expect(getSafeRedirectTarget("javascript:alert(1)")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("/app/test?q=javascript:void(0)")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("data:text/html,<script>alert(1)</script>")).toBe(ROUTES.app.studio)
  })

  it("rejects public paths outside of /app namespace", () => {
    expect(getSafeRedirectTarget("/")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("/login")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("/privacy")).toBe(ROUTES.app.studio)
  })

  it("handles null, undefined, empty, and non-string inputs safely", () => {
    expect(getSafeRedirectTarget(null)).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget(undefined)).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("")).toBe(ROUTES.app.studio)
    expect(getSafeRedirectTarget("   ")).toBe(ROUTES.app.studio)
  })

  it("respects custom fallback when supplied", () => {
    expect(getSafeRedirectTarget("https://attacker.com", "/app/history")).toBe("/app/history")
  })
})
