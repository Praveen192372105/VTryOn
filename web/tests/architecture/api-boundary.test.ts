import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import { authEndpoints } from "@/features/auth/api/endpoints"
import { uploadEndpoints } from "@/features/uploads/api/endpoints"
import { outfitEndpoints } from "@/features/outfits/api/endpoints"
import { favoriteEndpoints } from "@/features/favorites/api/endpoints"
import { tryOnEndpoints } from "@/features/try-on/api/endpoints"

const SRC_DIR = path.resolve(__dirname, "../../src")

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

describe("API Boundary & Canonical Endpoint Contract Tests", () => {
  const allFiles = getAllSourceFiles(SRC_DIR)

  describe("Endpoint Contract Invariants", () => {
    it("verifies canonical Auth endpoints", () => {
      expect(authEndpoints.register).toBe("/auth/register")
      expect(authEndpoints.login).toBe("/auth/login")
      expect(authEndpoints.logout).toBe("/auth/logout")
      expect(authEndpoints.refresh).toBe("/auth/refresh")
      expect(authEndpoints.me).toBe("/users/me")
    })

    it("verifies canonical Upload endpoints", () => {
      expect(uploadEndpoints.createPerson).toBe("/uploads/person")
      expect(uploadEndpoints.list).toBe("/uploads")
      expect(uploadEndpoints.detail("upload-123")).toBe("/uploads/upload-123")
      expect(uploadEndpoints.delete("upload-123")).toBe("/uploads/upload-123")
    })

    it("verifies canonical Outfit endpoints", () => {
      expect(outfitEndpoints.list).toBe("/outfits")
      expect(outfitEndpoints.detail("outfit-abc")).toBe("/outfits/outfit-abc")
    })

    it("verifies canonical Favorite endpoints (/outfits/{id}/favorite, not /favorites/{id})", () => {
      expect(favoriteEndpoints.list).toBe("/favorites")
      expect(favoriteEndpoints.favoriteOutfit("outfit-999")).toBe("/outfits/outfit-999/favorite")
      expect(favoriteEndpoints.unfavoriteOutfit("outfit-999")).toBe("/outfits/outfit-999/favorite")
    })

    it("verifies canonical Try-On endpoints (/try-ons, not /tryons or /history)", () => {
      expect(tryOnEndpoints.create).toBe("/try-ons")
      expect(tryOnEndpoints.list).toBe("/try-ons")
      expect(tryOnEndpoints.detail("job-777")).toBe("/try-ons/job-777")
      expect(tryOnEndpoints.delete("job-777")).toBe("/try-ons/job-777")
      expect(tryOnEndpoints.content("job-777")).toBe("/try-ons/job-777/content")
    })
  })

  describe("Architectural Discipline Audits", () => {
    it("prohibits stale/legacy endpoint paths in string literals across entire src/", () => {
      const stalePatterns = [
        /["'`]\/favorites\/[a-zA-Z0-9_-]+["'`]/, // old favorite by ID
        /["'`]\/tryons\b/, // missing hyphen
        /["'`]\/try-ons\/[^/]+\/result\b/, // fake result route
        /["'`]\/uploads\/person-images\b/, // legacy uploads route
        /["'`](\/api\/v1)?\/history\b/, // fake history route
      ]

      const violations: { file: string; match: string }[] = []

      for (const file of allFiles) {
        if (file.includes("__tests__")) continue
        const content = fs.readFileSync(file, "utf-8")

        for (const pattern of stalePatterns) {
          const match = content.match(pattern)
          if (match) {
            violations.push({
              file: path.relative(SRC_DIR, file),
              match: match[0],
            })
          }
        }
      }

      expect(violations).toEqual([])
    })

    it("prohibits raw fetch() calls in UI components and pages", () => {
      const uiFiles = allFiles.filter((file) => {
        const relative = path.relative(SRC_DIR, file).replace(/\\/g, "/")
        return (
          (relative.startsWith("components/") ||
            relative.startsWith("pages/") ||
            relative.includes("/components/")) &&
          !relative.includes("__tests__")
        )
      })

      const violations: string[] = []
      for (const file of uiFiles) {
        const content = fs.readFileSync(file, "utf-8")
        if (content.match(/\bfetch\s*\(/)) {
          violations.push(path.relative(SRC_DIR, file))
        }
      }

      expect(violations).toEqual([])
    })

    it("prohibits direct axios usage outside lib/api", () => {
      const nonApiFiles = allFiles.filter((file) => {
        const relative = path.relative(SRC_DIR, file).replace(/\\/g, "/")
        return !relative.startsWith("lib/api/") && !relative.includes("__tests__") && !relative.startsWith("test/")
      })

      const violations: string[] = []
      for (const file of nonApiFiles) {
        const content = fs.readFileSync(file, "utf-8")
        if (content.match(/from\s+["']axios["']/)) {
          violations.push(path.relative(SRC_DIR, file))
        }
      }

      expect(violations).toEqual([])
    })

    it("prohibits features from prefixing /api/v1 (base client handles prefix)", () => {
      const featureFiles = allFiles.filter((file) => {
        const relative = path.relative(SRC_DIR, file).replace(/\\/g, "/")
        return relative.startsWith("features/") && !relative.includes("__tests__")
      })

      const violations: string[] = []
      for (const file of featureFiles) {
        const content = fs.readFileSync(file, "utf-8")
        if (content.match(/["']\/api\/v1\//)) {
          violations.push(path.relative(SRC_DIR, file))
        }
      }

      expect(violations).toEqual([])
    })
  })
})
